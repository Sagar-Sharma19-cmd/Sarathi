import mongoose, { Schema, Document } from 'mongoose';
import type { Event as IEvent } from '@sarathi/shared';

export interface EventDocument extends Omit<IEvent, '_id'>, Document {}

const eventSchema = new Schema<EventDocument>(
  {
    userId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

eventSchema.index({ userId: 1, topic: 1, createdAt: -1 });

export const EventModel = mongoose.model<EventDocument>('Event', eventSchema);

