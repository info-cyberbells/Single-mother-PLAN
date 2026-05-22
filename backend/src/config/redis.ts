import Redis from 'ioredis';
import { env } from './env';

// Initialize Redis client for BullMQ
export const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});
