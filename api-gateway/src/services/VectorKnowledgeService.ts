import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { secretProvider } from '../config/secrets';
import { geminiService } from './GeminiService';

export interface VectorHit {
  id: string;
  score: number;
  title: string;
  text: string;
  sourceType?: string;
}

const FALLBACK_DIMENSION = 768; // Matches Gemini text-embedding-004

export class VectorKnowledgeService {
  private async buildVector(text: string): Promise<number[]> {
    const embedding = await geminiService.embedText(text);
    if (embedding && embedding.length) {
      return embedding;
    }

    // Deterministic hashed fallback to keep vector-search flow operational
    // even when embedding providers are unavailable.
    const vector = new Array<number>(FALLBACK_DIMENSION).fill(0);
    const normalized = text.toLowerCase().slice(0, 5000);
    for (let i = 0; i < normalized.length; i += 1) {
      const code = normalized.charCodeAt(i);
      const index = (code + i * 31) % FALLBACK_DIMENSION;
      vector[index] += 1;
    }

    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / magnitude);
  }

  async search(query: string, topK = env.RAG_VECTOR_TOP_K): Promise<VectorHit[]> {
    const host = env.PINECONE_INDEX_HOST;
    if (!host) {
      return [];
    }

    const apiKey = await secretProvider.get('PINECONE_API_KEY');
    if (!apiKey) {
      return [];
    }

    try {
      const vector = await this.buildVector(query);
      const response = await axios.post(
        `https://${host}/query`,
        {
          vector,
          topK,
          includeMetadata: true,
          namespace: env.PINECONE_NAMESPACE
        },
        {
          timeout: 4000,
          headers: {
            'Api-Key': apiKey,
            'Content-Type': 'application/json',
            'X-Pinecone-API-Version': '2024-07'
          }
        }
      );

      const matches = Array.isArray(response.data?.matches) ? response.data.matches : [];
      return matches
        .map((match: any) => ({
          id: String(match?.id ?? 'unknown'),
          score: Number(match?.score ?? 0),
          title: String(match?.metadata?.title ?? match?.metadata?.source ?? match?.id ?? 'Knowledge Base'),
          text: String(match?.metadata?.text ?? match?.metadata?.chunk ?? ''),
          sourceType: match?.metadata?.sourceType ? String(match.metadata.sourceType) : undefined
        }))
        .filter((hit: VectorHit) => hit.text.length > 0)
        .slice(0, topK);
    } catch (error) {
      logger.error({ error }, 'Vector knowledge query failed');
      return [];
    }
  }
}

export const vectorKnowledgeService = new VectorKnowledgeService();
