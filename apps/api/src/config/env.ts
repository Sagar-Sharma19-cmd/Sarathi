import { config } from 'dotenv';

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/sarathi',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'DEV_SMS_CONSOLE',
  SMS_API_KEY: process.env.SMS_API_KEY || '',
  SMS_API_SECRET: process.env.SMS_API_SECRET || '',
  SMS_SENDER_ID: process.env.SMS_SENDER_ID || 'SARATHI',
  WEB_ORIGIN: process.env.WEB_ORIGIN || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
} as const;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';

