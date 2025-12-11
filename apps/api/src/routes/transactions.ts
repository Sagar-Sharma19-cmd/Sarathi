import { Router } from 'express';
import { RemitSchema, PaginationSchema } from '@sarathi/shared';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validateRequest.js';
import { TransactionModel } from '../models/Transaction.js';
import { UserModel } from '../models/User.js';
import { EventModel } from '../models/Event.js';
import { recomputeAndSaveScore } from '../services/scoring.js';
import { smsProvider } from '../services/sms/index.js';
import {
  adjustUserBalanceWithHistory,
  recordOverdraftEvent,
  withTransaction,
  classifyRiskLevel,
} from '../services/finance.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

const router = Router();

router.use(authenticateUser);

router.get('/', validateQuery(PaginationSchema), async (req: AuthRequest, res, next) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const skip = (page - 1) * limit;

    const transactions = await TransactionModel.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TransactionModel.countDocuments({ userId: req.user!.userId });

    res.json({
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        type: t.type,
        amount: t.amount,
        counterparty: t.counterparty,
        stateCode: t.stateCode,
        status: t.status,
        createdAt: t.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.INSUFFICIENT_FUNDS) {
      const metadata = (error as AppError & {
        metadata?: { userId?: string; attemptedAmount: number; availableBalance: number };
      }).metadata;

      if (metadata) {
        const overdraftUserId = metadata.userId ?? req.user!.userId;
        await recordOverdraftEvent({
          userId: overdraftUserId,
          attemptedAmount: metadata.attemptedAmount,
          availableBalance: metadata.availableBalance,
        });

        try {
          await recomputeAndSaveScore(overdraftUserId);
        } catch (scoreError) {
          console.error('Failed to recompute score after overdraft', scoreError);
        }
      }
    }

    next(error);
  }
});

router.post('/remit', validateBody(RemitSchema), async (req: AuthRequest, res, next) => {
  try {
    const { amount, counterparty } = req.body;
    const userId = req.user!.userId;

    const {
      transaction,
      senderBalanceAfter,
      recipientId,
      senderPhone,
    } = await withTransaction(async session => {
      const senderQuery = UserModel.findById(userId);
      if (session) {
        senderQuery.session(session);
      }
      const sender = await senderQuery;
      if (!sender) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
      }

      const recipientQuery = UserModel.findOne({ phoneE164: counterparty });
      if (session) {
        recipientQuery.session(session);
      }
      const recipient = await recipientQuery;
      if (!recipient) {
        throw new AppError(
          ErrorCodes.INVALID_INPUT,
          'Recipient must be an existing Sarathi user',
          400
        );
      }

      if (recipient._id.equals(sender._id)) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'Cannot send money to yourself', 400);
      }

      const currentBalance = typeof sender.totalMoney === 'number' ? sender.totalMoney : 5000;
      if (currentBalance < amount) {
        const insufficientError = new AppError(
          ErrorCodes.INSUFFICIENT_FUNDS,
          'Insufficient balance',
          400
        ) as AppError & {
          metadata?: { userId: string; attemptedAmount: number; availableBalance: number };
        };
        insufficientError.metadata = {
          userId,
          attemptedAmount: amount,
          availableBalance: currentBalance,
        };
        throw insufficientError;
      }

      const createOptions = session ? { session } : undefined;
      const [transaction] = await TransactionModel.create(
        [
          {
            userId,
            type: 'remit',
            amount,
            counterparty,
            stateCode: sender.stateCode,
            status: 'success',
          },
        ],
        createOptions
      );

      const riskLevel = classifyRiskLevel(amount);

      const senderBalanceAfter = await adjustUserBalanceWithHistory({
        userId,
        delta: -amount,
        amount,
        transactionType: 'remit',
        entryType: 'debit',
        counterparty,
        description: `Sent money to ${counterparty}`,
        transactionId: transaction._id.toString(),
        timestamp: transaction.createdAt,
        riskLevel,
        session,
      });

      await adjustUserBalanceWithHistory({
        userId: recipient._id.toString(),
        delta: amount,
        amount,
        transactionType: 'remit_credit',
        entryType: 'credit',
        counterparty: sender.phoneE164,
        description: `Received money from ${sender.phoneE164}`,
        transactionId: transaction._id.toString(),
        timestamp: transaction.createdAt,
        riskLevel,
        session,
      });

      const eventPayloads = [
        {
          userId,
          topic: 'transaction.remit',
          payload: { transactionId: transaction._id.toString(), amount, counterparty },
        },
        {
          userId: recipient._id.toString(),
          topic: 'transaction.remit.received',
          payload: {
            transactionId: transaction._id.toString(),
            amount,
            counterparty: sender.phoneE164,
          },
        },
      ];
      const eventOptions = session ? { session } : undefined;
      await EventModel.create(eventPayloads, eventOptions);

      return {
        transaction,
        senderBalanceAfter,
        recipientId: recipient._id.toString(),
        senderPhone: sender.phoneE164,
      };
    });

    const message = `Sarathi: Money sent successfully. Amount: ₹${amount}. New balance: ₹${senderBalanceAfter.toFixed(
      2
    )}. Ref: ${transaction._id.toString().substring(0, 8)}`;
    await smsProvider.send(senderPhone, message);

    await Promise.all([
      recomputeAndSaveScore(userId),
      recomputeAndSaveScore(recipientId),
    ]);

    res.json({
      id: transaction._id.toString(),
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      totalMoney: senderBalanceAfter,
      recipientId,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

