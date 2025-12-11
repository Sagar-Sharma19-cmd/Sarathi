import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.error({ errors: result.error.errors }, 'Validation error');
      return next(
        new AppError(ErrorCodes.INVALID_INPUT, `Invalid request body: ${result.error.errors[0]?.message || 'validation failed'}`, 400)
      );
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new AppError(ErrorCodes.INVALID_INPUT, 'Invalid query parameters', 400)
      );
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}

