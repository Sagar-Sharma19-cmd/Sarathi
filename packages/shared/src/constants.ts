export const REASON_CODES = {
  R1_REM_HISTORY: 'R1_REM_HISTORY',
  R2_STABILITY: 'R2_STABILITY',
  R3_FIRST_TIMER: 'R3_FIRST_TIMER',
  R4_DEFAULT_RISK: 'R4_DEFAULT_RISK',
  R5_COUNTERPARTY_STABILITY: 'R5_COUNTERPARTY_STABILITY',
  R6_TIMELY_REPAY: 'R6_TIMELY_REPAY',
  R7_BALANCE_STABILITY: 'R7_BALANCE_STABILITY',
  R8_LOW_RISK_ACTIVITY: 'R8_LOW_RISK_ACTIVITY',
  R9_DELAYED_REPAY: 'R9_DELAYED_REPAY',
  R10_OVERDRAFT_RISK: 'R10_OVERDRAFT_RISK',
  R11_HIGH_RISK_ACTIVITY: 'R11_HIGH_RISK_ACTIVITY',
} as const;

export const SCORE_BANDS = {
  A: 'A',
  B: 'B',
  C: 'C',
} as const;

export const LOAN_STATUS = {
  PREAPPROVED: 'preapproved',
  APPROVED: 'approved',
  DISBURSED: 'disbursed',
  REPAID: 'repaid',
  DEFAULTED: 'defaulted',
  REJECTED: 'rejected',
} as const;

export const TRANSACTION_TYPE = {
  REMIT: 'remit',
  REPAY: 'repay',
  LOAN_DISBURSAL: 'loan_disbursal',
  SAFESEND_ESCROW: 'safesend_escrow',
  SAFESEND_RELEASE: 'safesend_release',
  SAFESEND_REFUND: 'safesend_refund',
} as const;

export const TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
} as const;

export const SAFESEND_STATUS = {
  PENDING: 'pending',
  AWAITING_PROOF: 'awaiting_proof',
  UNDER_REVIEW: 'under_review',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  REJECTED: 'rejected',
} as const;

export const SAFESEND_GOAL = {
  SCHOOL_FEES: 'school_fees',
  GROCERIES: 'groceries',
  RENT: 'rent',
  MEDICAL: 'medical',
  UTILITIES: 'utilities',
  OTHER: 'other',
} as const;

export const PROOF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const KYC_STATUS = {
  NONE: 'none',
  BASIC: 'basic',
} as const;

export const LANGUAGE = {
  EN: 'en',
  HI: 'hi',
} as const;

export const CONSENT_VALIDITY_DAYS = 180;
export const JWT_EXPIRY = '24h';
export const OTP_SEND_LIMIT = 5;
export const OTP_VERIFY_LIMIT = 10;
export const OTP_RESEND_COOLDOWN = 60; // seconds
export const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 60;
export const RATE_LIMIT_MAX_PER_USER = 10;

export const LOAN_LIMITS = {
  BAND_A: {
    maxAmount: 5000,
    termDays30: 30,
    termDays60: 60,
    apr: 18,
  },
  BAND_B: {
    maxAmount: 3000,
    termDays: 30,
    apr: 18,
  },
  BAND_C: {
    maxAmount: 1000,
    termDays: 30,
    apr: 18,
    minScore: 600,
    minRemittances: 3,
  },
} as const;

export const INDIAN_STATES = {
  AN: 'Andaman and Nicobar Islands',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CH: 'Chandigarh',
  CT: 'Chhattisgarh',
  DN: 'Dadra and Nagar Haveli',
  DD: 'Daman and Diu',
  DL: 'Delhi',
  GA: 'Goa',
  GJ: 'Gujarat',
  HR: 'Haryana',
  HP: 'Himachal Pradesh',
  JK: 'Jammu and Kashmir',
  JH: 'Jharkhand',
  KA: 'Karnataka',
  KL: 'Kerala',
  LD: 'Lakshadweep',
  MP: 'Madhya Pradesh',
  MH: 'Maharashtra',
  MN: 'Manipur',
  ML: 'Meghalaya',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OR: 'Odisha',
  PY: 'Puducherry',
  PB: 'Punjab',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TN: 'Tamil Nadu',
  TG: 'Telangana',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UT: 'Uttarakhand',
  WB: 'West Bengal',
} as const;

