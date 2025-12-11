import mongoose, { Schema, Document } from 'mongoose';
import type { Score as IScore } from '@sarathi/shared';

export interface ScoreDocument extends Omit<IScore, '_id'>, Document {}

const scoreSchema = new Schema<ScoreDocument>(
  {
    userId: { type: String, required: true, index: true },
    score: { type: Number, required: true },
    band: { type: String, enum: ['A', 'B', 'C'], required: true },
    reasonCodes: [{ type: String }],
    stateCode: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

scoreSchema.index({ userId: 1, createdAt: -1 });

export const ScoreModel = mongoose.model<ScoreDocument>('Score', scoreSchema);

