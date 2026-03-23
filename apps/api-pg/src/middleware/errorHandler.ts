import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  logger.error({ err, path: req.path, code }, 'Request failed');

  res.status(status).json({
    error: {
      code,
      message: err.message ?? 'Something went wrong',
    },
  });
}

