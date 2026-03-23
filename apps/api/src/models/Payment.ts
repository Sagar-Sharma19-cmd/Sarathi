import mongoose, { Schema, Document } from 'mongoose';

export type PaymentPurpose = 'wallet_topup' | 'loan_repay' | 'safesend_deposit';
export type PaymentStatus = 'created' | 'attempted' | 'paid' | 'failed' | 'refunded';

export interface PaymentDocument extends Document {
  userId: string;
  purpose: PaymentPurpose;
  amount: number; // INR rupees
  currency: 'INR';
  status: PaymentStatus;

  // Razorpay identifiers
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Optional business links
  loanId?: string;
  safesend?: {
    merchantId: string;
    goal: string;
    lockReason?: string;
  };
  escrowId?: string;
  walletTopupTransactionId?: string;

  // Audit
  notes?: Record<string, unknown>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    userId: { type: String, required: true, index: true },
    purpose: { type: String, enum: ['wallet_topup', 'loan_repay', 'safesend_deposit'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },

    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    loanId: { type: String },
    safesend: {
      merchantId: { type: String },
      goal: { type: String },
      lockReason: { type: String },
    },
    escrowId: { type: String },
    walletTopupTransactionId: { type: String },

    notes: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ purpose: 1, status: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<PaymentDocument>('Payment', paymentSchema);

