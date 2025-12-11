import mongoose, { Schema, Document } from 'mongoose';
import type { Consent as IConsent } from '@sarathi/shared';

export interface ConsentDocument extends Omit<IConsent, '_id'>, Document {}

const consentSchema = new Schema<ConsentDocument>(
  {
    userId: { type: String, required: true, index: true },
    purpose: { type: String, required: true },
    tokenJWT: { type: String, required: true },
    validTill: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

consentSchema.index({ userId: 1, purpose: 1 });

export const ConsentModel = mongoose.model<ConsentDocument>('Consent', consentSchema);

