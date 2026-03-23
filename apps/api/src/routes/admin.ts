import { Router, type Router as ExpressRouter } from 'express';
import { AdminSeedSchema, AdminPoorNetworkToggleSchema, PaginationSchema } from '@sarathi/shared';
import { authenticateUser, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validateRequest.js';
import { TransactionModel } from '../models/Transaction.js';
import { UserModel } from '../models/User.js';
import { recomputeAndSaveScore } from '../services/scoring.js';
import { isDevelopment } from '../config/env.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { PaymentModel } from '../models/Payment.js';

const router: ExpressRouter = Router();

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

router.get('/users', validateQuery(PaginationSchema), async (req: AuthRequest, res, next) => {
  try {
    if (!isDevelopment && !req.user!.isAdmin) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Admin access required', 403);
    }

    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      UserModel.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('phoneE164 sarathiId preferredLang stateCode kycStatus isAdmin totalMoney createdAt')
        .lean(),
      UserModel.countDocuments({}),
    ]);

    res.json({
      users: users.map(u => ({
        userId: u._id.toString(),
        phoneE164: u.phoneE164,
        sarathiId: u.sarathiId,
        preferredLang: u.preferredLang,
        stateCode: u.stateCode,
        kycStatus: u.kycStatus,
        isAdmin: u.isAdmin,
        totalMoney: typeof u.totalMoney === 'number' ? u.totalMoney : 5000,
        createdAt: u.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/payments', validateQuery(PaginationSchema), async (req: AuthRequest, res, next) => {
  try {
    if (!isDevelopment && !req.user!.isAdmin) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Admin access required', 403);
    }

    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const { status, purpose, userId } = req.query as any;
    const query: any = {};
    if (status) query.status = status;
    if (purpose) query.purpose = purpose;
    if (userId) query.userId = userId;

    const [payments, total] = await Promise.all([
      PaymentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentModel.countDocuments(query),
    ]);

    res.json({
      payments: payments.map(p => ({
        paymentId: p._id.toString(),
        userId: p.userId,
        purpose: p.purpose,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        loanId: p.loanId,
        escrowId: p.escrowId,
        walletTopupTransactionId: p.walletTopupTransactionId,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

