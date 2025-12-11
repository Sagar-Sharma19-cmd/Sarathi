import mongoose, { Schema, Document } from 'mongoose';
import type { Transaction as ITransaction } from '@sarathi/shared';

export interface TransactionDocument extends Omit<ITransaction, '_id'>, Document {}

const transactionSchema = new Schema<TransactionDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: { 
      type: String, 
      enum: [
        'remit', 
        'repay', 
        'loan_disbursal', 
        'safesend_escrow', 
        'safesend_release', 
        'safesend_refund'
      ], 
      required: true 
    },
    amount: { type: Number, required: true },
    counterparty: { type: String },
    stateCode: { type: String, required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });

export const TransactionModel = mongoose.model<TransactionDocument>(
  'Transaction',
  transactionSchema
);

