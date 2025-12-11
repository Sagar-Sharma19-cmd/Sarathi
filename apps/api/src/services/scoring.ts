import { computeScore, type ScoringSignals, type ScoringResult } from '@sarathi/shared';
import { TransactionModel } from '../models/Transaction.js';
import { LoanModel } from '../models/Loan.js';
import { ScoreModel } from '../models/Score.js';
import { UserModel } from '../models/User.js';
import { logger } from '../config/logger.js';

export async function calculateScoringSignals(userId: string): Promise<ScoringSignals> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Get remittances in last 6 months
  const remittances = await TransactionModel.find({
    userId,
    type: 'remit',
    status: 'success',
    createdAt: { $gte: sixMonthsAgo },
  }).sort({ createdAt: 1 });

  // Count months with remittances >= 2000
  const monthlyRemittances = new Map<string, number>();
  const counterpartyMonths = new Map<string, Set<string>>();

  for (const tx of remittances) {
    const monthKey = `${tx.createdAt.getFullYear()}-${tx.createdAt.getMonth()}`;
    monthlyRemittances.set(monthKey, (monthlyRemittances.get(monthKey) || 0) + tx.amount);

    // Track counterparty by month
    if (tx.counterparty) {
      if (!counterpartyMonths.has(tx.counterparty)) {
        counterpartyMonths.set(tx.counterparty, new Set());
      }
      counterpartyMonths.get(tx.counterparty)!.add(monthKey);
    }
  }

  const monthsRemitted2000Plus = Array.from(monthlyRemittances.values()).filter(
    amt => amt >= 2000
  ).length;

  // Calculate last 3 months stability
  const last3MonthsRemittances = remittances.filter(tx => tx.createdAt >= threeMonthsAgo);
  const last3MonthsAmounts = new Map<string, number>();
  
  for (const tx of last3MonthsRemittances) {
    const monthKey = `${tx.createdAt.getFullYear()}-${tx.createdAt.getMonth()}`;
    last3MonthsAmounts.set(monthKey, (last3MonthsAmounts.get(monthKey) || 0) + tx.amount);
  }

  const monthlyAmounts = Array.from(last3MonthsAmounts.values());
  const last3MonthsMean = monthlyAmounts.length > 0
    ? monthlyAmounts.reduce((a, b) => a + b, 0) / monthlyAmounts.length
    : 0;

  let last3MonthsStdDev = 0;
  if (monthlyAmounts.length > 1) {
    const variance =
      monthlyAmounts.reduce((sum, amt) => sum + Math.pow(amt - last3MonthsMean, 2), 0) /
      monthlyAmounts.length;
    last3MonthsStdDev = Math.sqrt(variance);
  }

  // Find max repeated counterparty months
  let repeatedCounterpartyMonths = 0;
  for (const months of counterpartyMonths.values()) {
    if (months.size > repeatedCounterpartyMonths) {
      repeatedCounterpartyMonths = months.size;
    }
  }

  const loans = await LoanModel.find({ userId }).lean();
  const firstLoanRepaid = loans.some(loan => loan.status === 'repaid');
  const defaulted = loans.some(loan => loan.status === 'defaulted');

  let timelyRepayments = 0;
  let delayedRepayments = 0;
  const now = new Date();

  for (const loan of loans) {
    if (!loan.disbursedAt) {
      continue;
    }

    const dueDate = new Date(loan.disbursedAt);
    dueDate.setDate(dueDate.getDate() + loan.termDays);

    if (loan.status === 'repaid') {
      if (loan.repaidAt && loan.repaidAt <= dueDate) {
        timelyRepayments += 1;
      } else {
        delayedRepayments += 1;
      }
    } else if (loan.status === 'disbursed' && dueDate < now) {
      delayedRepayments += 1;
    } else if (loan.status === 'defaulted') {
      delayedRepayments += 1;
    }
  }

  const user = await UserModel.findById(userId).lean();
  const transactionHistory = (user?.transactionHistory ?? []).filter(entry => {
    if (!entry.timestamp) {
      return false;
    }
    const ts = new Date(entry.timestamp);
    return ts >= sixMonthsAgo;
  });

  const balanceSamples = transactionHistory.map(entry => entry.balanceAfter ?? 0);
  const averageBalance = balanceSamples.length
    ? balanceSamples.reduce((sum, value) => sum + value, 0) / balanceSamples.length
    : 0;

  let balanceStdDev = 0;
  if (balanceSamples.length > 1) {
    const variance =
      balanceSamples.reduce(
        (sum, value) => sum + Math.pow(value - averageBalance, 2),
        0
      ) / balanceSamples.length;
    balanceStdDev = Math.sqrt(variance);
  }

  const lowRiskTransactions = transactionHistory.filter(
    entry => entry.riskLevel === 'low'
  ).length;
  const highRiskTransactions = transactionHistory.filter(
    entry => entry.riskLevel === 'high'
  ).length;

  const overdraftEvents = (user?.overdraftHistory ?? []).filter(event => {
    if (!event.timestamp) {
      return false;
    }
    const ts = new Date(event.timestamp);
    return ts >= sixMonthsAgo;
  });
  const overdraftCount = overdraftEvents.length;

  return {
    monthsRemitted2000Plus,
    last3MonthsStdDev,
    last3MonthsMean,
    repeatedCounterpartyMonths,
    firstLoanRepaid,
    defaulted,
    timelyRepayments,
    delayedRepayments,
    averageBalance,
    balanceStdDev,
    lowRiskTransactions,
    highRiskTransactions,
    overdraftCount,
  };
}

export async function recomputeAndSaveScore(userId: string): Promise<ScoringResult> {
  logger.info({ userId }, 'Recomputing score');

  const signals = await calculateScoringSignals(userId);
  const result = computeScore(signals);

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await ScoreModel.create({
    userId,
    score: result.score,
    band: result.band,
    reasonCodes: result.reasonCodes,
    stateCode: user.stateCode,
  });

  return result;
}

export async function getLatestScore(userId: string): Promise<ScoringResult | null> {
  const latestScore = await ScoreModel.findOne({ userId }).sort({ createdAt: -1 });
  
  if (!latestScore) {
    return null;
  }

  // Check if score is older than 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  if (latestScore.createdAt < twentyFourHoursAgo) {
    // Recompute score
    return await recomputeAndSaveScore(userId);
  }

  return {
    score: latestScore.score,
    band: latestScore.band,
    reasonCodes: latestScore.reasonCodes,
  };
}

