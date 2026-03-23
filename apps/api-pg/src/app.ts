import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { generalRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization'],
    }),
  );

  app.use(generalRateLimit);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/auth', authRoutes);
  app.use('/analytics', analyticsRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
  });

  app.use(errorHandler);

  return app;
}

