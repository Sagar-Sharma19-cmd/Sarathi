import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { generalRateLimit } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import consentRoutes from './routes/consent.js';
import transactionsRoutes from './routes/transactions.js';
import scoreRoutes from './routes/score.js';
import loanRoutes from './routes/loan.js';
import adminRoutes from './routes/admin.js';
import safesendRoutes from './routes/safesend.js';
import chatRoutes from './routes/chat.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    pinoHttp({
      logger,
      redact: ['req.headers.authorization', 'req.body.code'],
    })
  );

  // Rate limiting
  app.use(generalRateLimit);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);
  app.use('/me', profileRoutes); // Alias for /profile/me
  app.use('/consent', consentRoutes);
  app.use('/transactions', transactionsRoutes);
  app.use('/score', scoreRoutes);
  app.use('/loan', loanRoutes);
  app.use('/admin', adminRoutes);
  app.use('/safesend', safesendRoutes);
  app.use('/chat', chatRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
      },
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

