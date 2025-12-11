import mongoose, { Schema, Document } from 'mongoose';
import type { SafeSendProof as ISafeSendProof } from '@sarathi/shared';

export interface SafeSendProofDocument extends Omit<ISafeSendProof, '_id'>, Document {}

const safeSendProofSchema = new Schema<SafeSendProofDocument>(
  {
    escrowId: { type: String, required: true, index: true },
    merchantId: { type: String, required: true, index: true },
    proofUrl: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

safeSendProofSchema.index({ escrowId: 1 });
safeSendProofSchema.index({ status: 1, createdAt: -1 });

export const SafeSendProofModel = mongoose.model<SafeSendProofDocument>(
  'SafeSendProof',
  safeSendProofSchema
);

