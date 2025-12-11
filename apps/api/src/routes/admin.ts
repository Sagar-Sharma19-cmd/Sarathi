import { Router } from 'express';
import { AdminSeedSchema, AdminPoorNetworkToggleSchema } from '@sarathi/shared';
import { authenticateUser, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validateRequest.js';
import { TransactionModel } from '../models/Transaction.js';
import { UserModel } from '../models/User.js';
import { recomputeAndSaveScore } from '../services/scoring.js';
import { isDevelopment } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

const router = Router();

router.use(authenticateUser);

router.get('/seed', validateQuery(AdminSeedSchema), async (req: AuthRequest, res, next) => {
  try {
    if (!isDevelopment && !req.user!.isAdmin) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Admin access required', 403);
    }

    const { months, amount, counterparty } = req.query as unknown as {
      months: number;
      amount: number;
      counterparty: string;
    };

    const userId = req.user!.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    // Create monthly remittances
    const transactions = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      date.setDate(15); // Mid-month

      const tx = await TransactionModel.create({
        userId,
        type: 'remit',
        amount,
        counterparty,
        stateCode: user.stateCode,
        status: 'success',
        createdAt: date,
      });

      transactions.push(tx);
    }

    // Recompute score
    const score = await recomputeAndSaveScore(userId);

    res.json({
      inserted: transactions.length,
      score,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/poor-network-toggle', validateBody(AdminPoorNetworkToggleSchema), async (req: AuthRequest, res, next) => {
  try {
    if (!isDevelopment && !req.user!.isAdmin) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Admin access required', 403);
    }

    const { enabled } = req.body;
    
    // In a real app, this would set a flag in Redis or database
    // For MVP, we just return the flag
    res.json({ enabled });
  } catch (error) {
    next(error);
  }
});

export default router;

