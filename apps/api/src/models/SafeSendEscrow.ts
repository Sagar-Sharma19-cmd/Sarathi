import mongoose, { Schema, Document } from 'mongoose';
import type { SafeSendEscrow as ISafeSendEscrow } from '@sarathi/shared';

export interface SafeSendEscrowDocument extends Omit<ISafeSendEscrow, '_id'>, Document {}

const safeSendEscrowSchema = new Schema<SafeSendEscrowDocument>(
  {
    senderId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    goal: {
      type: String,
      required: true,
      enum: ['school_fees', 'groceries', 'rent', 'medical', 'utilities', 'other'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'awaiting_proof', 'under_review', 'released', 'refunded', 'rejected'],
      default: 'awaiting_proof',
    },
    lockReason: { type: String },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

safeSendEscrowSchema.index({ senderId: 1, status: 1 });
safeSendEscrowSchema.index({ merchantId: 1, status: 1 });
safeSendEscrowSchema.index({ status: 1, createdAt: -1 });

export const SafeSendEscrowModel = mongoose.model<SafeSendEscrowDocument>(
  'SafeSendEscrow',
  safeSendEscrowSchema
);

