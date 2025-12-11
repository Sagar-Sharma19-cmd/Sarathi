import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, path: req.path }, 'Error occurred');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: ErrorCodes.INVALID_INPUT,
        message: 'Invalid input',
        details: err.errors,
      },
    });
  }

  // Default error
  return res.status(500).json({
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Internal server error',
    },
  });
}

