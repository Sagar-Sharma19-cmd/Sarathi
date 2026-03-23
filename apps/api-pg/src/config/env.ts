import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4001'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  OTP_MAX_PER_DAY: z.coerce.number().default(10),
  WEB_ORIGIN: z.string().default('http://localhost:5173')
});

export const env = envSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';

