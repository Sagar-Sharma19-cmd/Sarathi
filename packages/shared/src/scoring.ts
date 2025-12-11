import { REASON_CODES, SCORE_BANDS } from './constants.js';
import type { ScoringSignals, ScoringResult, ReasonCode } from './types.js';

const BASE_SCORE = 580;

export function computeScore(signals: ScoringSignals): ScoringResult {
  let score = BASE_SCORE;
  const reasonCodes: ReasonCode[] = [];

  // R1: +10 per completed monthly remittance ≥ ₹2,000 in last 6 months (cap +60)
  if (signals.monthsRemitted2000Plus > 0) {
    const remittanceBonus = Math.min(signals.monthsRemitted2000Plus * 10, 60);
    score += remittanceBonus;
    reasonCodes.push(REASON_CODES.R1_REM_HISTORY);
  }

  // R2: +15 if std-dev of last 3 months' remittances < 25% of mean
  if (
    signals.last3MonthsMean > 0 &&
    signals.last3MonthsStdDev < signals.last3MonthsMean * 0.25
  ) {
    score += 15;
    reasonCodes.push(REASON_CODES.R2_STABILITY);
  }

  // R5: +10 if same counterparty repeated in ≥3 different months in last 6 months
  if (signals.repeatedCounterpartyMonths >= 3) {
    score += 10;
    reasonCodes.push(REASON_CODES.R5_COUNTERPARTY_STABILITY);
  }

  // R3: +20 on first fully paid loan
  if (signals.firstLoanRepaid) {
    score += 20;
    reasonCodes.push(REASON_CODES.R3_FIRST_TIMER);
  }

  // R4: −50 on any default
  if (signals.defaulted) {
    score -= 50;
    reasonCodes.push(REASON_CODES.R4_DEFAULT_RISK);
  }

  // R6: +12 per timely repayment (cap +48)
  if (signals.timelyRepayments > 0) {
    const timelyBonus = Math.min(signals.timelyRepayments * 12, 48);
    score += timelyBonus;
    reasonCodes.push(REASON_CODES.R6_TIMELY_REPAY);
  }

  // R9: −15 per delayed repayment (cap −60)
  if (signals.delayedRepayments > 0) {
    const delayedPenalty = Math.min(signals.delayedRepayments * 15, 60);
    score -= delayedPenalty;
    reasonCodes.push(REASON_CODES.R9_DELAYED_REPAY);
  }

  // R7: +12 for consistent balance (avg ≥ ₹4,000 & std-dev ≤ 15% of mean)
  if (
    signals.averageBalance >= 4000 &&
    signals.balanceStdDev <= signals.averageBalance * 0.15
  ) {
    score += 12;
    reasonCodes.push(REASON_CODES.R7_BALANCE_STABILITY);
  }

  // R8: +2 per low-risk transaction (cap +20) for recent behaviour
  if (signals.lowRiskTransactions > 0) {
    const lowRiskBonus = Math.min(signals.lowRiskTransactions * 2, 20);
    score += lowRiskBonus;
    reasonCodes.push(REASON_CODES.R8_LOW_RISK_ACTIVITY);
  }

  // R11: −10 per high-risk transfer (cap −50)
  if (signals.highRiskTransactions > 0) {
    const highRiskPenalty = Math.min(signals.highRiskTransactions * 10, 50);
    score -= highRiskPenalty;
    reasonCodes.push(REASON_CODES.R11_HIGH_RISK_ACTIVITY);
  }

  // R10: −20 per overdraft attempt (cap −60)
  if (signals.overdraftCount > 0) {
    const overdraftPenalty = Math.min(signals.overdraftCount * 20, 60);
    score -= overdraftPenalty;
    reasonCodes.push(REASON_CODES.R10_OVERDRAFT_RISK);
  }

  // Clamp score within realistic credit score bounds
  score = Math.max(300, Math.min(score, 900));

  // Determine band
  let band: 'A' | 'B' | 'C';
  if (score >= 680) {
    band = SCORE_BANDS.A;
  } else if (score >= 630) {
    band = SCORE_BANDS.B;
  } else {
    band = SCORE_BANDS.C;
  }

  return {
    score,
    band,
    reasonCodes,
  };
}

export function calculateEMI(principal: number, apr: number, termDays: number): number {
  // Simple interest calculation for short-term loans
  const interest = (principal * apr * termDays) / (365 * 100);
  const totalAmount = principal + interest;
  return Math.ceil(totalAmount);
}

