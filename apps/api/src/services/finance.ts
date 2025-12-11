import mongoose, { ClientSession } from 'mongoose';
import { UserModel } from '../models/User.js';
import type { TransactionRiskLevel } from '@sarathi/shared';
import { AppError, ErrorCodes } from '../utils/errors.js';

export type TransactionEntryType = 'debit' | 'credit';

export interface BalanceAdjustmentOptions {
  userId: string;
  delta: number;
  amount: number;
  transactionType: string;
  entryType: TransactionEntryType;
  counterparty?: string;
  description?: string;
  transactionId?: string;
  timestamp?: Date;
  riskLevel?: TransactionRiskLevel;
  session?: ClientSession | null;
}

export interface OverdraftRecordOptions {
  userId: string;
  attemptedAmount: number;
  availableBalance: number;
  session?: ClientSession;
}

export function classifyRiskLevel(amount: number): TransactionRiskLevel {
  if (amount <= 5000) {
    return 'low';
  }
  if (amount <= 20000) {
    return 'medium';
  }
  return 'high';
}

export async function adjustUserBalanceWithHistory(options: BalanceAdjustmentOptions): Promise<number> {
  const {
    userId,
    delta,
    amount,
    transactionType,
    entryType,
    counterparty,
    description,
    transactionId,
    timestamp,
    riskLevel,
    session,
  } = options;

  const userQuery = UserModel.findById(userId);
  if (session) {
    userQuery.session(session);
  }
  const user = await userQuery;
  if (!user) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
  }

  const currentBalance = typeof user.totalMoney === 'number' ? user.totalMoney : 5000;
  const newBalance = currentBalance + delta;

  if (newBalance < 0) {
    throw new AppError(ErrorCodes.INSUFFICIENT_FUNDS, 'Insufficient balance', 400);
  }

  const entryTimestamp = timestamp ?? new Date();
  const entryRiskLevel = riskLevel ?? classifyRiskLevel(amount);

  const updateOptions = session ? { session } : undefined;

  await UserModel.updateOne(
    { _id: userId },
    {
      $set: { totalMoney: newBalance },
      $push: {
        transactionHistory: {
          $each: [
            {
              timestamp: entryTimestamp,
              amount,
              type: entryType,
              transactionType,
              counterparty,
              description,
              balanceAfter: newBalance,
              transactionId,
              riskLevel: entryRiskLevel,
            },
          ],
          $slice: -200,
        },
      },
    },
    updateOptions
  );

  return newBalance;
}

export async function recordOverdraftEvent(options: OverdraftRecordOptions): Promise<void> {
  const { userId, attemptedAmount, availableBalance, session } = options;

  const updateOptions = session ? { session } : undefined;

  await UserModel.updateOne(
    { _id: userId },
    {
      $push: {
        overdraftHistory: {
          $each: [
            {
              timestamp: new Date(),
              attemptedAmount,
              availableBalance,
            },
          ],
          $slice: -100,
        },
      },
    },
    updateOptions
  );
}

export async function withTransaction<T>(handler: (session: ClientSession | null) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  let result: T | undefined;
  let fallback = false;
  try {
    try {
      await session.withTransaction(async () => {
        result = await handler(session);
      });
    } catch (error) {
      const code = typeof error === 'object' && error !== null ? (error as { code?: number }).code : undefined;
      const message = error instanceof Error ? error.message : '';
      const illegalTransaction = code === 20 || message.includes('Transaction numbers are only allowed');

      if (!illegalTransaction) {
        throw error;
      }

      fallback = true;
    }

    if (fallback) {
      result = await handler(null);
    }

    if (result === undefined) {
      throw new Error('Transaction handler did not return a result');
    }
    return result;
  } finally {
    await session.endSession();
  }
}

