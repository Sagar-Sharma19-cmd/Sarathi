import { createClient } from 'redis';
import { env } from './env';

export const redis = createClient({
  url: env.REDIS_URL,
});

export async function initRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

