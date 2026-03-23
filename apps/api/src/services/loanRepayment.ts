import type { ClientSession } from 'mongoose';
import { LoanModel } from '../models/Loan.js';
import { TransactionModel } from '../models/Transaction.js';
import { UserModel } from '../models/User.js';
import { EventModel } from '../models/Event.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { calculateEMI, type LoanStatus } from '@sarathi/shared';
import { adjustUserBalanceWithHistory, classifyRiskLevel } from './finance.js';

export async function repayLoanFromWallet(options: {
  userId: string;
  loanId: string;
  amount: number;
  session: ClientSession | null;
}) {
  const { userId, loanId, amount, session } = options;

  const loanQuery = LoanModel.findOne({ _id: loanId, userId });
  if (session) loanQuery.session(session);
  const loan = await loanQuery;
  if (!loan) throw new AppError(ErrorCodes.LOAN_NOT_FOUND, 'Loan not found', 404);
  if (loan.status !== 'disbursed') {
    throw new AppError(ErrorCodes.INVALID_INPUT, 'Loan is not active', 400);
  }

  const userQuery = UserModel.findById(userId);
  if (session) userQuery.session(session);
  const user = await userQuery;
  if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);

  const currentBalance = typeof user.totalMoney === 'number' ? user.totalMoney : 5000;
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

  const repaymentsQuery = TransactionModel.find({
    userId,
    type: 'repay',
    status: 'success',
  });
  if (session) repaymentsQuery.session(session);
  const repayments = await repaymentsQuery.lean();

  const totalDue = calculateEMI(loan.principal, loan.apr, loan.termDays);
  const totalRepaid = repayments.reduce((sum, tx) => sum + tx.amount, 0);
  const remaining = Math.max(0, totalDue - totalRepaid);

  if (amount > remaining) {
    throw new AppError(ErrorCodes.INVALID_INPUT, 'Repayment amount exceeds remaining balance', 400);
  }

  const createOptions = session ? { session } : undefined;
  const [transaction] = await TransactionModel.create(
    [
      {
        userId,
        type: 'repay',
        amount,
        stateCode: user.stateCode,
        status: 'success',
      },
    ],
    createOptions
  );

  const balanceAfter = await adjustUserBalanceWithHistory({
    userId,
    delta: -amount,
    amount,
    transactionType: 'loan_repay',
    entryType: 'debit',
    description: 'Loan repayment',
    transactionId: transaction._id.toString(),
    timestamp: transaction.createdAt,
    riskLevel: classifyRiskLevel(amount),
    session,
  });

  const newRemaining = Math.max(0, remaining - amount);
  let loanStatus: LoanStatus = loan.status as LoanStatus;

  if (newRemaining <= 0) {
    loan.status = 'repaid';
    loan.repaidAt = new Date();
    loanStatus = loan.status;
  }

  if (session) await loan.save({ session });
  else await loan.save();

  const eventPayload = {
    userId,
    topic: newRemaining <= 0 ? 'loan.repaid' : 'loan.partial_repay',
    payload:
      newRemaining <= 0
        ? { loanId: loan._id.toString(), transactionId: transaction._id.toString() }
        : {
            loanId: loan._id.toString(),
            amount,
            remaining: newRemaining,
            transactionId: transaction._id.toString(),
          },
  };
  const eventOptions = session ? { session } : undefined;
  if (eventOptions) {
    await EventModel.create([eventPayload], eventOptions);
  } else {
    await EventModel.create(eventPayload);
  }

  return {
    loanStatus,
    newRemaining,
    transactionId: transaction._id.toString(),
    phoneE164: user.phoneE164,
    totalMoney: balanceAfter,
    principal: loan.principal,
    termDays: loan.termDays,
    disbursedAt: loan.disbursedAt,
  };
}

