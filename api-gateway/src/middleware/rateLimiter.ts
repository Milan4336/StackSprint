import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { redisClient } from '../config/redis';

interface RateLimitConfig {
  keyPrefix: string;
  windowSeconds: number;
  maxRequests: number;
  includePath?: boolean;
}

const buildKey = (req: Request, config: RateLimitConfig): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const pathPart = config.includePath ? req.path : 'global';
  return `${config.keyPrefix}:${ip}:${pathPart}`;
};

const createRedisRateLimiter = (config: RateLimitConfig) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = buildKey(req, config);

    try {
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, config.windowSeconds);
      }

      const ttl = await redisClient.ttl(key);
      const remaining = Math.max(0, config.maxRequests - count);

      res.setHeader('RateLimit-Limit', String(config.maxRequests));
      res.setHeader('RateLimit-Remaining', String(remaining));
      res.setHeader('RateLimit-Reset', String(Math.max(0, ttl)));
      res.setHeader('RateLimit-Policy', `${config.maxRequests};w=${config.windowSeconds}`);

      if (count > config.maxRequests) {
        res.status(429).json({
          error: 'Too many requests. Please retry after the rate-limit window.'
        });
        return;
      }

      next();
    } catch {
      // Fail-open if redis is unavailable so platform traffic is not blocked.
      next();
    }
  };

export const apiRateLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:api',
  windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: env.RATE_LIMIT_MAX
});

export const authRateLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:auth',
  windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: env.RATE_LIMIT_AUTH_MAX,
  includePath: true
});

export const loginRateLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:login',
  windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: env.RATE_LIMIT_LOGIN_MAX
});

export const copilotRateLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:copilot',
  windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
  maxRequests: Math.max(10, Math.floor(env.RATE_LIMIT_MAX / 2))
});
