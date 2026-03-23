import { TransactionModel } from '../models/Transaction.js';
import { adjustUserBalanceWithHistory, classifyRiskLevel } from './finance.js';
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from '@sarathi/shared';
import type { ClientSession } from 'mongoose';

export async function creditWallet(options: {
  userId: string;
  amount: number;
  stateCode: string;
  description?: string;
  counterparty?: string;
  session: ClientSession | null;
}) {
  const { userId, amount, stateCode, description, counterparty, session } = options;
  const createOptions = session ? { session } : undefined;

  const [transaction] = await TransactionModel.create(
    [
      {
        userId,
        type: TRANSACTION_TYPE.TOPUP,
        amount,
        counterparty,
        stateCode,
        status: TRANSACTION_STATUS.SUCCESS,
      },
    ],
    createOptions
  );

  const balanceAfter = await adjustUserBalanceWithHistory({
    userId,
    delta: amount,
    amount,
    transactionType: TRANSACTION_TYPE.TOPUP,
    entryType: 'credit',
    counterparty,
    description: description ?? 'Wallet top-up',
    transactionId: transaction._id.toString(),
    timestamp: transaction.createdAt,
    riskLevel: classifyRiskLevel(amount),
    session,
  });

  return { transactionId: transaction._id.toString(), balanceAfter, createdAt: transaction.createdAt };
}

