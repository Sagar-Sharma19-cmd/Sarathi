import { createClient } from 'redis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', err => logger.error({ err }, 'Redis Client Error'));
redisClient.on('connect', () => logger.info('Redis connected'));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.disconnect();
  }
}

