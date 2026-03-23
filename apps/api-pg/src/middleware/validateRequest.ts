import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/errors';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Invalid request body';
      return next(new AppError('INVALID_INPUT', msg, 400));
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? 'Invalid query parameters';
      return next(new AppError('INVALID_INPUT', msg, 400));
    }
    req.query = result.data as any;
    next();
  };
}

