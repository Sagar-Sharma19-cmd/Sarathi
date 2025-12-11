import rateLimit from 'express-rate-limit';
import { redisClient } from '../config/redis.js';
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS } from '@sarathi/shared';
import { ErrorCodes } from '../utils/errors.js';

export const generalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  // Simple in-memory store for MVP (Redis store has compatibility issues)
  // In production, use a proper Redis store with correct configuration
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later.',
      },
    });
  },
});

