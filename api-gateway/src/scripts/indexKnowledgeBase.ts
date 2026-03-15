import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { loadRuntimeSecrets } from '../config/runtimeSecrets';

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 140;
const FALLBACK_DIMENSION = 768; // Matches Gemini text-embedding-004

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const splitIntoChunks = (value: string): string[] => {
  const text = normalizeText(value);
  if (!text) return [];

  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const next = text.slice(cursor, cursor + CHUNK_SIZE);
    chunks.push(next);
    if (cursor + CHUNK_SIZE >= text.length) break;
    cursor += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
};

const fallbackVector = (text: string): number[] => {
  const vector = new Array<number>(FALLBACK_DIMENSION).fill(0);
  const normalized = text.toLowerCase();
  for (let i = 0; i < normalized.length; i += 1) {
    const index = (normalized.charCodeAt(i) + i * 31) % FALLBACK_DIMENSION;
    vector[index] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
  return vector.map((item) => item / magnitude);
};

const collectSourceFiles = (): Array<{ title: string; source: string; text: string; sourceType: string }> => {
  const cwd = process.cwd();
  const repoRoot = path.resolve(cwd, '..');
  const candidates = [
    { file: path.join(repoRoot, 'README.md'), sourceType: 'documentation' },
    { file: path.join(repoRoot, 'PATCH_NOTES.md'), sourceType: 'documentation' }
  ];

  const sources: Array<{ title: string; source: string; text: string; sourceType: string }> = [];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate.file)) {
      sources.push({
        title: path.basename(candidate.file),
        source: candidate.file,
        text: fs.readFileSync(candidate.file, 'utf8'),
        sourceType: candidate.sourceType
      });
    }
  }

  const servicesDir = path.join(cwd, 'src', 'services');
  if (fs.existsSync(servicesDir)) {
    const files = fs.readdirSync(servicesDir).filter((file) => file.endsWith('.ts'));
    for (const file of files) {
      const fullPath = path.join(servicesDir, file);
      sources.push({
        title: `service:${file}`,
        source: fullPath,
        text: fs.readFileSync(fullPath, 'utf8'),
        sourceType: 'code'
      });
    }
  }

  return sources;
};

const buildVectorId = (source: string, chunk: string, index: number): string => {
  const hash = crypto.createHash('sha256').update(`${source}:${index}:${chunk}`).digest('hex').slice(0, 20);
  return `${path.basename(source)}-${index}-${hash}`;
};

const run = async () => {
  await loadRuntimeSecrets();
  const [{ env }, { logger }, { geminiService }, { secretProvider }] = await Promise.all([
    import('../config/env'),
    import('../config/logger'),
    import('../services/GeminiService'),
    import('../config/secrets')
  ]);

  if (!env.PINECONE_INDEX_HOST) {
    throw new Error('PINECONE_INDEX_HOST is required to index the knowledge base.');
  }

  const apiKey = await secretProvider.get('PINECONE_API_KEY');
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY is required to index the knowledge base.');
  }

  const sources = collectSourceFiles();
  if (!sources.length) {
    logger.warn('No source files found for vector indexing.');
    return;
  }

  const vectors: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }> = [];
  for (const source of sources) {
    const chunks = splitIntoChunks(source.text);
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const embedding = await geminiService.embedText(chunk);
      const values = embedding && embedding.length ? embedding : fallbackVector(chunk);
      vectors.push({
        id: buildVectorId(source.source, chunk, i),
        values,
        metadata: {
          title: source.title,
          source: source.source,
          sourceType: source.sourceType,
          chunkIndex: i,
          text: chunk
        }
      });
    }
  }

  logger.info({ count: vectors.length }, 'Prepared vectors for upsert');

  const batchSize = 50;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await axios.post(
      `https://${env.PINECONE_INDEX_HOST}/vectors/upsert`,
      {
        vectors: batch,
        namespace: env.PINECONE_NAMESPACE
      },
      {
        timeout: 8000,
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
          'X-Pinecone-API-Version': '2024-07'
        }
      }
    );
    logger.info({ upserted: Math.min(i + batch.length, vectors.length), total: vectors.length }, 'Upserted vectors');
  }

  logger.info('Knowledge base indexing completed.');
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Knowledge base indexing failed', error);
  process.exitCode = 1;
});
