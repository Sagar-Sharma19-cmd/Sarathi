import pino from 'pino';
import { isDevelopment } from './env.js';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.body.code', 'res.headers["set-cookie"]'],
    remove: true,
  },
});

