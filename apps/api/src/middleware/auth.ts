import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/jwt.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { UserModel } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    sarathiId: string;
    phoneE164: string;
    isAdmin: boolean;
  };
}

export async function authenticateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyJWT(token);

    // Fetch user to get isAdmin flag
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not found', 401);
    }

    req.user = {
      userId: payload.userId,
      sarathiId: payload.sarathiId,
      phoneE164: payload.phoneE164,
      isAdmin: user.isAdmin,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token', 401));
    }
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Admin access required', 403);
  }
  next();
}

