import { REASON_CODES, SCORE_BANDS, LOAN_STATUS, TRANSACTION_TYPE, TRANSACTION_STATUS, KYC_STATUS, LANGUAGE, SAFESEND_STATUS, SAFESEND_GOAL, PROOF_STATUS } from './constants.js';

export type ReasonCode = (typeof REASON_CODES)[keyof typeof REASON_CODES];
export type ScoreBand = (typeof SCORE_BANDS)[keyof typeof SCORE_BANDS];
export type LoanStatus = (typeof LOAN_STATUS)[keyof typeof LOAN_STATUS];
export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];
export type TransactionStatus = (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];
export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];
export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];
export type SafeSendStatus = (typeof SAFESEND_STATUS)[keyof typeof SAFESEND_STATUS];
export type SafeSendGoalType = (typeof SAFESEND_GOAL)[keyof typeof SAFESEND_GOAL];
export type ProofStatus = (typeof PROOF_STATUS)[keyof typeof PROOF_STATUS];

export type TransactionRiskLevel = 'low' | 'medium' | 'high';

export interface UserTransactionHistoryEntry {
  timestamp: Date;
  amount: number;
  type: 'debit' | 'credit';
  transactionType: string;
  counterparty?: string;
  description?: string;
  balanceAfter: number;
  transactionId?: string;
  riskLevel: TransactionRiskLevel;
}

export interface UserOverdraftEvent {
  timestamp: Date;
  attemptedAmount: number;
  availableBalance: number;
}

export interface User {
  _id: string;
  phoneE164: string;
  sarathiId: string;
  preferredLang: Language;
  stateCode: string;
  kycStatus: KycStatus;
  isAdmin: boolean;
  totalMoney: number;
  transactionHistory: UserTransactionHistoryEntry[];
  overdraftHistory: UserOverdraftEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Consent {
  _id: string;
  userId: string;
  purpose: string;
  tokenJWT: string;
  validTill: Date;
  revoked: boolean;
  createdAt: Date;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  counterparty?: string;
  stateCode: string;
  status: TransactionStatus;
  createdAt: Date;
}

export interface Score {
  _id: string;
  userId: string;
  score: number;
  band: ScoreBand;
  reasonCodes: ReasonCode[];
  stateCode: string;
  createdAt: Date;
}

export interface Loan {
  _id: string;
  userId: string;
  principal: number;
  apr: number;
  termDays: number;
  status: LoanStatus;
  approvedAt?: Date;
  disbursedAt?: Date;
  repaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  _id: string;
  userId: string;
  topic: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface ScoringSignals {
  monthsRemitted2000Plus: number;
  last3MonthsStdDev: number;
  last3MonthsMean: number;
  repeatedCounterpartyMonths: number;
  firstLoanRepaid: boolean;
  defaulted: boolean;
  timelyRepayments: number;
  delayedRepayments: number;
  averageBalance: number;
  balanceStdDev: number;
  lowRiskTransactions: number;
  highRiskTransactions: number;
  overdraftCount: number;
}

export interface ScoringResult {
  score: number;
  band: ScoreBand;
  reasonCodes: ReasonCode[];
}

export interface LoanDecision {
  decision: 'approved' | 'rejected';
  band: ScoreBand;
  reasonCodes: ReasonCode[];
  offer?: {
    amount: number;
    apr: number;
    termDays: number;
    estimatedEMI: number;
    dueDate: Date;
  };
}

export interface Merchant {
  _id: string;
  name: string;
  phoneE164: string;
  category: string;
  verified: boolean;
  stateCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeSendEscrow {
  _id: string;
  senderId: string;
  merchantId: string;
  amount: number;
  goal: SafeSendGoalType;
  status: SafeSendStatus;
  lockReason?: string;
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeSendProof {
  _id: string;
  escrowId: string;
  merchantId: string;
  proofUrl: string;
  description?: string;
  status: ProofStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

