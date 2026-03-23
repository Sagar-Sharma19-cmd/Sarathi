import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export interface AuthUser {
  userId: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHENTICATED', 'Authentication required', 401));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    next(new AppError('UNAUTHENTICATED', 'Invalid or expired token', 401));
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError('FORBIDDEN', 'Admin access required', 403));
  }
  next();
}

