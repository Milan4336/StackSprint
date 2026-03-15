import pino from 'pino';
import { env } from './env';

type LokiLabels = Record<string, string>;

const parseLokiLabels = (raw: string): LokiLabels => {
  const entries = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [key, ...rest] = item.split('=');
      return [key?.trim(), rest.join('=').trim()] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1]));

  return Object.fromEntries(entries);
};

const lokiLabels = parseLokiLabels(env.LOKI_LABELS);

const sendToLoki = async (entry: Record<string, unknown>): Promise<void> => {
  if (!env.LOKI_PUSH_URL) return;

  const timestampNs = (BigInt(Date.now()) * 1_000_000n).toString();
  const level = typeof entry.level === 'string' ? entry.level : 'info';

  const payload = {
    streams: [
      {
        stream: {
          ...lokiLabels,
          level
        },
        values: [[timestampNs, JSON.stringify(entry)]]
      }
    ]
  };

  try {
    await fetch(env.LOKI_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    if (env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Loki push failed:', error);
    }
  }
};

const loggerOptions: pino.LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'password']
};

if (env.NODE_ENV === 'development') {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: { colorize: true }
  };
}

if (env.LOKI_PUSH_URL) {
  loggerOptions.hooks = {
    logMethod(args, method, level) {
      method.apply(this, args);

      const levelLabel = pino.levels.labels[level] ?? String(level);
      const [first, second] = args as [unknown, unknown?];
      const context = typeof first === 'object' && first !== null ? (first as Record<string, unknown>) : {};
      const message =
        typeof second === 'string'
          ? second
          : typeof first === 'string'
            ? first
            : 'log';

      void sendToLoki({
        level: levelLabel,
        message,
        ...context,
        timestamp: new Date().toISOString()
      });
    }
  };
}

export const logger = pino(loggerOptions);
