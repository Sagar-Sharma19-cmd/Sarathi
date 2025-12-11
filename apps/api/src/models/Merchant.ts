import mongoose, { Schema, Document } from 'mongoose';
import type { Merchant as IMerchant } from '@sarathi/shared';

export interface MerchantDocument extends Omit<IMerchant, '_id'>, Document {}

const merchantSchema = new Schema<MerchantDocument>(
  {
    name: { type: String, required: true },
    phoneE164: { type: String, required: true, index: true },
    category: { type: String, required: true },
    verified: { type: Boolean, default: false },
    stateCode: { type: String, required: true, length: 2 },
  },
  {
    timestamps: true,
  }
);

merchantSchema.index({ stateCode: 1, verified: 1 });
merchantSchema.index({ category: 1 });

export const MerchantModel = mongoose.model<MerchantDocument>('Merchant', merchantSchema);

