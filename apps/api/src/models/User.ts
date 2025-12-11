import mongoose, { Schema, Document } from 'mongoose';
import type {
  User as IUser,
  UserTransactionHistoryEntry,
  UserOverdraftEvent,
} from '@sarathi/shared';

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

const transactionHistorySchema = new Schema<UserTransactionHistoryEntry>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    transactionType: { type: String, required: true },
    counterparty: { type: String },
    description: { type: String },
    balanceAfter: { type: Number, required: true },
    transactionId: { type: String },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
  },
  { _id: false }
);

const overdraftHistorySchema = new Schema<UserOverdraftEvent>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    attemptedAmount: { type: Number, required: true },
    availableBalance: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<UserDocument>(
  {
    phoneE164: { type: String, required: true, unique: true, index: true },
    sarathiId: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    preferredLang: { type: String, enum: ['en', 'hi'], default: 'en' },
    stateCode: { type: String, required: true, length: 2 },
    kycStatus: { type: String, enum: ['none', 'basic'], default: 'none' },
    isAdmin: { type: Boolean, default: false },
    totalMoney: { type: Number, default: 5000, alias: 'total_money' },
    transactionHistory: {
      type: [transactionHistorySchema],
      alias: 'transaction_history',
      default: [],
    },
    overdraftHistory: {
      type: [overdraftHistorySchema],
      alias: 'overdraft_history',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);

