import Redis from 'ioredis';
import { env } from './env';

export const redisClient = new Redis(env.REDIS_URI, {
  tls: {},                      // REQUIRED for Azure Redis
  maxRetriesPerRequest: null,  // prevents crash on startup
  enableReadyCheck: true,
  lazyConnect: true            // prevents immediate connection crash
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("ready", () => {
  console.log("Redis ready");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});