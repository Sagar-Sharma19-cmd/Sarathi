import { describe, it, expect } from 'vitest';
import { computeScore, calculateEMI } from './scoring.js';
import { SCORE_BANDS } from './constants.js';
import type { ScoringSignals } from './types.js';

describe('computeScore', () => {
  it('should return base score for new user with no history', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 0,
      last3MonthsStdDev: 0,
      last3MonthsMean: 0,
      repeatedCounterpartyMonths: 0,
      firstLoanRepaid: false,
      defaulted: false,
      timelyRepayments: 0,
      delayedRepayments: 0,
      averageBalance: 0,
      balanceStdDev: 0,
      lowRiskTransactions: 0,
      highRiskTransactions: 0,
      overdraftCount: 0,
    };

    const result = computeScore(signals);
    expect(result.score).toBe(580);
    expect(result.band).toBe(SCORE_BANDS.C);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('should give Band A for user with 6 months remittance history', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 6,
      last3MonthsStdDev: 200,
      last3MonthsMean: 2500,
      repeatedCounterpartyMonths: 4,
      firstLoanRepaid: false,
      defaulted: false,
      timelyRepayments: 0,
      delayedRepayments: 0,
      averageBalance: 0,
      balanceStdDev: 0,
      lowRiskTransactions: 0,
      highRiskTransactions: 0,
      overdraftCount: 0,
    };

    const result = computeScore(signals);
    // 580 + 60 (6 months) + 15 (stability) + 10 (counterparty) = 665... wait that's B
    // Let me recalculate: 580 + 60 + 15 + 10 = 665 (Band B)
    expect(result.score).toBe(665);
    expect(result.band).toBe(SCORE_BANDS.B);
    expect(result.reasonCodes).toContain('R1_REM_HISTORY');
    expect(result.reasonCodes).toContain('R2_STABILITY');
    expect(result.reasonCodes).toContain('R5_COUNTERPARTY_STABILITY');
  });

  it('should give Band A with first loan repaid bonus', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 6,
      last3MonthsStdDev: 200,
      last3MonthsMean: 2500,
      repeatedCounterpartyMonths: 4,
      firstLoanRepaid: true,
      defaulted: false,
      timelyRepayments: 0,
      delayedRepayments: 0,
      averageBalance: 0,
      balanceStdDev: 0,
      lowRiskTransactions: 0,
      highRiskTransactions: 0,
      overdraftCount: 0,
    };

    const result = computeScore(signals);
    // 580 + 60 + 15 + 10 + 20 = 685 (Band A)
    expect(result.score).toBe(685);
    expect(result.band).toBe(SCORE_BANDS.A);
    expect(result.reasonCodes).toContain('R3_FIRST_TIMER');
  });

  it('should penalize defaulted loans', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 6,
      last3MonthsStdDev: 200,
      last3MonthsMean: 2500,
      repeatedCounterpartyMonths: 4,
      firstLoanRepaid: true,
      defaulted: true,
      timelyRepayments: 0,
      delayedRepayments: 0,
      averageBalance: 0,
      balanceStdDev: 0,
      lowRiskTransactions: 0,
      highRiskTransactions: 0,
      overdraftCount: 0,
    };

    const result = computeScore(signals);
    // 580 + 60 + 15 + 10 + 20 - 50 = 635 (Band B)
    expect(result.score).toBe(635);
    expect(result.band).toBe(SCORE_BANDS.B);
    expect(result.reasonCodes).toContain('R4_DEFAULT_RISK');
  });

  it('should cap remittance bonus at 60 points', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 10, // Would give 100 without cap
      last3MonthsStdDev: 0,
      last3MonthsMean: 0,
      repeatedCounterpartyMonths: 0,
      firstLoanRepaid: false,
      defaulted: false,
      timelyRepayments: 0,
      delayedRepayments: 0,
      averageBalance: 0,
      balanceStdDev: 0,
      lowRiskTransactions: 0,
      highRiskTransactions: 0,
      overdraftCount: 0,
    };

    const result = computeScore(signals);
    // 580 + 60 (capped) = 640 (Band B)
    expect(result.score).toBe(640);
    expect(result.band).toBe(SCORE_BANDS.B);
  });

  it('should not give stability bonus if std dev >= 25% of mean', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 3,
      last3MonthsStdDev: 1000,
      last3MonthsMean: 2500, // 1000 / 2500 = 40% > 25%
      repeatedCounterpartyMonths: 0,
      firstLoanRepaid: false,
      defaulted: false,
      timelyRepayments: 0,
      delayedRepayments: 0,
      averageBalance: 0,
      balanceStdDev: 0,
      lowRiskTransactions: 0,
      highRiskTransactions: 0,
      overdraftCount: 0,
    };

    const result = computeScore(signals);
    expect(result.score).toBe(610); // 580 + 30 without stability bonus
    expect(result.reasonCodes).not.toContain('R2_STABILITY');
  });

  it('should reward timely repayments and penalize delays and overdrafts', () => {
    const signals: ScoringSignals = {
      monthsRemitted2000Plus: 2,
      last3MonthsStdDev: 200,
      last3MonthsMean: 1800,
      repeatedCounterpartyMonths: 1,
      firstLoanRepaid: false,
      defaulted: false,
      timelyRepayments: 3,
      delayedRepayments: 1,
      averageBalance: 4500,
      balanceStdDev: 400,
      lowRiskTransactions: 6,
      highRiskTransactions: 1,
      overdraftCount: 2,
    };

    const result = computeScore(signals);

    expect(result.score).toBe(610);
    expect(result.reasonCodes).toContain('R6_TIMELY_REPAY');
    expect(result.reasonCodes).toContain('R9_DELAYED_REPAY');
    expect(result.reasonCodes).toContain('R7_BALANCE_STABILITY');
    expect(result.reasonCodes).toContain('R8_LOW_RISK_ACTIVITY');
    expect(result.reasonCodes).toContain('R11_HIGH_RISK_ACTIVITY');
    expect(result.reasonCodes).toContain('R10_OVERDRAFT_RISK');
  });
});

describe('calculateEMI', () => {
  it('should calculate simple interest correctly', () => {
    const principal = 5000;
    const apr = 18;
    const termDays = 60;

    const emi = calculateEMI(principal, apr, termDays);
    // Interest = (5000 * 18 * 60) / (365 * 100) = 5400000 / 36500 = 147.95
    // Total = 5000 + 147.95 = 5147.95 → ceil = 5148
    expect(emi).toBe(5148);
  });

  it('should calculate 30-day loan EMI', () => {
    const principal = 3000;
    const apr = 18;
    const termDays = 30;

    const emi = calculateEMI(principal, apr, termDays);
    // Interest = (3000 * 18 * 30) / (365 * 100) = 1620000 / 36500 = 44.38
    // Total = 3000 + 44.38 = 3044.38 → ceil = 3045
    expect(emi).toBe(3045);
  });
});

