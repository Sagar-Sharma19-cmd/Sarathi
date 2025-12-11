const API_BASE = '/api';

class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Callback for handling auth errors - will be set by AuthContext
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('jwt');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new APIError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An error occurred',
      response.status
    );

    // Handle authentication errors (401) - token expired or invalid
    if (response.status === 401 && onAuthError) {
      console.warn('Authentication error detected - logging out');
      onAuthError();
    }

    throw error;
  }

  return data;
}

export const api = {
  // Registration & Password login
  register: (phoneE164: string, password: string) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phoneE164, password }),
    }),

  loginInitiate: (phoneE164: string, password: string) =>
    request('/auth/login/initiate', {
      method: 'POST',
      body: JSON.stringify({ phoneE164, password }),
    }),

  loginVerify: (phoneE164: string, code: string) =>
    request<{
      jwt: string;
      sarathiId: string;
      profile: {
        userId: string;
        phoneE164: string;
        preferredLang: string;
        stateCode: string;
        kycStatus: string;
        isAdmin?: boolean;
      };
    }>('/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneE164, code }),
    }),

  // Auth
  sendOTP: (phoneE164: string) =>
    request('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phoneE164 }),
    }),

  verifyOTP: (phoneE164: string, code: string) =>
    request<{
      jwt: string;
      sarathiId: string;
      profile: {
        userId: string;
        phoneE164: string;
        preferredLang: string;
        stateCode: string;
        kycStatus: string;
      };
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneE164, code }),
    }),

  // Profile
  getMe: () =>
    request<{
      user: {
        userId: string;
        phoneE164: string;
        sarathiId: string;
        preferredLang: string;
        stateCode: string;
        kycStatus: string;
        isAdmin: boolean;
        totalMoney: number;
        transactionHistory: Array<{
          timestamp: Date;
          amount: number;
          type: 'debit' | 'credit';
          transactionType: string;
          counterparty?: string;
          description?: string;
          balanceAfter: number;
          transactionId?: string;
          riskLevel: 'low' | 'medium' | 'high';
        }>;
      };
      latestScore: {
        score: number;
        band: string;
        reasonCodes: string[];
      } | null;
      activeLoan: {
        loanId: string;
        principal: number;
        apr: number;
        termDays: number;
        status: string;
        disbursedAt: Date;
      } | null;
    }>('/profile/me'),

  updateState: (stateCode: string) =>
    request<{ stateCode: string }>('/profile/state', {
      method: 'POST',
      body: JSON.stringify({ stateCode }),
    }),

  updateLanguage: (preferredLang: string) =>
    request<{ preferredLang: string }>('/profile/language', {
      method: 'POST',
      body: JSON.stringify({ preferredLang }),
    }),

  // Consent
  createConsent: (purpose: string) =>
    request<{
      consentId: string;
      tokenPreview: string;
      validTill: Date;
    }>('/consent', {
      method: 'POST',
      body: JSON.stringify({ purpose }),
    }),

  getConsents: () =>
    request<{
      consents: Array<{
        consentId: string;
        purpose: string;
        validTill: Date;
        revoked: boolean;
        createdAt: Date;
      }>;
    }>('/consent'),

  // Transactions
  getTransactions: (page: number = 1, limit: number = 20) =>
    request<{
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        counterparty?: string;
        stateCode: string;
        status: string;
        createdAt: Date;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/transactions?page=${page}&limit=${limit}`),

  remit: (amount: number, counterparty: string) =>
    request<{
      id: string;
      status: string;
      amount: number;
      createdAt: Date;
      totalMoney: number;
      recipientId: string;
    }>('/transactions/remit', {
      method: 'POST',
      body: JSON.stringify({ amount, counterparty }),
    }),

  // Score
  getScore: () =>
    request<{
      current: {
        score: number;
        band: string;
        reasonCodes: string[];
      };
      history: Array<{
        score: number;
        band: string;
        reasonCodes: string[];
        createdAt: Date;
      }>;
    }>('/score'),

  // Loan
  requestLoan: (amount: number) =>
    request<{
      decision: 'approved' | 'rejected';
      band: string;
      reasonCodes: string[];
      offer?: {
        loanId: string;
        amount: number;
        apr: number;
        termDays: number;
        estimatedEMI: number;
        dueDate: Date;
      };
    }>('/loan/request', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  acceptLoan: (loanId: string) =>
    request<{
      status: string;
      disbursedAt: Date;
      transactionId: string;
      totalMoney: number;
    }>('/loan/accept', {
      method: 'POST',
      body: JSON.stringify({ loanId }),
    }),

  repayLoan: (loanId: string, amount: number) =>
    request<{
      status: string;
      remaining: number;
      transactionId: string;
      totalMoney: number;
    }>('/loan/repay', {
      method: 'POST',
      body: JSON.stringify({ loanId, amount }),
    }),

  getActiveLoan: () =>
    request<{
      activeLoan: {
        loanId: string;
        principal: number;
        apr: number;
        termDays: number;
        status: string;
        disbursedAt: Date;
        totalDue: number;
        totalRepaid: number;
        remaining: number;
      } | null;
    }>('/loan/active'),

  // Admin
  seedData: (months: number, amount: number, counterparty: string) =>
    request<{
      inserted: number;
      score: {
        score: number;
        band: string;
        reasonCodes: string[];
      };
    }>(`/admin/seed?months=${months}&amount=${amount}&counterparty=${counterparty}`),

  togglePoorNetwork: (enabled: boolean) =>
    request<{ enabled: boolean }>('/admin/poor-network-toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),

  // SafeSend
  getMerchants: (stateCode?: string, verified?: boolean) =>
    request<{
      merchants: Array<{
        _id: string;
        name: string;
        phoneE164: string;
        category: string;
        verified: boolean;
        stateCode: string;
      }>;
    }>(`/safesend/merchants?${stateCode ? `stateCode=${stateCode}&` : ''}${verified !== undefined ? `verified=${verified}` : ''}`),

  createMerchant: (name: string, phoneE164: string, category: string, stateCode: string) =>
    request<{
      merchant: {
        _id: string;
        name: string;
        phoneE164: string;
        category: string;
        verified: boolean;
        stateCode: string;
      };
    }>('/safesend/merchants', {
      method: 'POST',
      body: JSON.stringify({ name, phoneE164, category, stateCode }),
    }),

  verifyMerchant: (merchantId: string) =>
    request<{
      merchant: {
        _id: string;
        name: string;
        verified: boolean;
      };
    }>(`/safesend/merchants/${merchantId}/verify`, {
      method: 'POST',
    }),

  createSafeSend: (merchantId: string, amount: number, goal: string, lockReason?: string) =>
    request<{
      escrow: {
        _id: string;
        senderId: string;
        merchantId: string;
        amount: number;
        goal: string;
        status: string;
        createdAt: Date;
      };
      totalMoney: number;
    }>('/safesend/escrow', {
      method: 'POST',
      body: JSON.stringify({ merchantId, amount, goal, lockReason }),
    }),

  getMySafeSends: (page: number = 1, limit: number = 20) =>
    request<{
      escrows: Array<{
        _id: string;
        merchantId: string;
        amount: number;
        goal: string;
        status: string;
        createdAt: Date;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/safesend/escrow/my?page=${page}&limit=${limit}`),

  getMerchantSafeSends: (merchantId: string, page: number = 1, limit: number = 20) =>
    request<{
      escrows: Array<{
        _id: string;
        senderId: string;
        amount: number;
        goal: string;
        status: string;
        createdAt: Date;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/safesend/escrow/merchant/${merchantId}?page=${page}&limit=${limit}`),

  getSafeSendDetails: (escrowId: string) =>
    request<{
      escrow: {
        _id: string;
        senderId: string;
        merchantId: string;
        amount: number;
        goal: string;
        status: string;
        lockReason?: string;
        releasedAt?: Date;
        refundedAt?: Date;
        createdAt: Date;
      };
      proofs: Array<{
        _id: string;
        proofUrl: string;
        description?: string;
        status: string;
        reviewedAt?: Date;
        rejectionReason?: string;
        createdAt: Date;
      }>;
      merchant: {
        _id: string;
        name: string;
        phoneE164: string;
        category: string;
      };
    }>(`/safesend/escrow/${escrowId}`),

  submitProof: (escrowId: string, proofUrl: string, description?: string) =>
    request<{
      proof: {
        _id: string;
        escrowId: string;
        proofUrl: string;
        status: string;
        createdAt: Date;
      };
    }>('/safesend/proof', {
      method: 'POST',
      body: JSON.stringify({ escrowId, proofUrl, description }),
    }),

  getPendingProofs: (page: number = 1, limit: number = 20) =>
    request<{
      proofs: Array<{
        _id: string;
        escrowId: string;
        merchantId: string;
        proofUrl: string;
        description?: string;
        status: string;
        createdAt: Date;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/safesend/proof/pending?page=${page}&limit=${limit}`),

  reviewProof: (proofId: string, approved: boolean, rejectionReason?: string) =>
    request<{
      proof: {
        _id: string;
        status: string;
        reviewedAt: Date;
      };
      escrow: {
        _id: string;
        status: string;
        releasedAt?: Date;
      };
    }>('/safesend/proof/review', {
      method: 'POST',
      body: JSON.stringify({ proofId, approved, rejectionReason }),
    }),

  refundSafeSend: (escrowId: string) =>
    request<{
      escrow: {
        _id: string;
        status: string;
        refundedAt: Date;
      };
      totalMoney: number;
    }>('/safesend/escrow/refund', {
      method: 'POST',
      body: JSON.stringify({ escrowId }),
    }),

  // AI Chat
  sendChatMessage: (message: string, language: 'en' | 'hi', history: Array<{ role: string; content: string }>) =>
    request<{
      response: string;
      timestamp: string;
    }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, language, history }),
    }),
};

export { APIError };

