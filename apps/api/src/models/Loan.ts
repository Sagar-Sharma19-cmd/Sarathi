import mongoose, { Schema, Document } from 'mongoose';
import type { Loan as ILoan } from '@sarathi/shared';

export interface LoanDocument extends Omit<ILoan, '_id'>, Document {}

const loanSchema = new Schema<LoanDocument>(
  {
    userId: { type: String, required: true, index: true },
    principal: { type: Number, required: true },
    apr: { type: Number, required: true },
    termDays: { type: Number, required: true },
    status: {
      type: String,
      enum: ['preapproved', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'],
      default: 'preapproved',
    },
    approvedAt: { type: Date },
    disbursedAt: { type: Date },
    repaidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

loanSchema.index({ userId: 1, status: 1 });

export const LoanModel = mongoose.model<LoanDocument>('Loan', loanSchema);

