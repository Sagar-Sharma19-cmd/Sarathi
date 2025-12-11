import { SafeSendEscrowModel } from '../models/SafeSendEscrow.js';
import { SafeSendProofModel } from '../models/SafeSendProof.js';
import { MerchantModel } from '../models/Merchant.js';
import { TransactionModel } from '../models/Transaction.js';
import { UserModel } from '../models/User.js';
import { smsProvider } from './sms/index.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from '@sarathi/shared';
import {
  withTransaction,
  adjustUserBalanceWithHistory,
  classifyRiskLevel,
  recordOverdraftEvent,
} from './finance.js';
import { recomputeAndSaveScore } from './scoring.js';

export async function createEscrow(
  senderId: string,
  merchantId: string,
  amount: number,
  goal: string,
  lockReason?: string
) {
  try {
    const {
      escrow,
      senderPhone,
      merchantPhone,
      merchantName,
      totalMoney,
    } = await withTransaction(async session => {
      const senderQuery = UserModel.findById(senderId);
      if (session) {
        senderQuery.session(session);
      }
      const sender = await senderQuery;
      if (!sender) throw new AppError(ErrorCodes.NOT_FOUND, 'Sender not found', 404);

      const merchantQuery = MerchantModel.findById(merchantId);
      if (session) {
        merchantQuery.session(session);
      }
      const merchant = await merchantQuery;
      if (!merchant) throw new AppError(ErrorCodes.NOT_FOUND, 'Merchant not found', 404);

      if (!merchant.verified) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'Merchant is not verified', 400);
      }

      const currentBalance = typeof sender.totalMoney === 'number' ? sender.totalMoney : 5000;
      if (currentBalance < amount) {
        const insufficientError = new AppError(
          ErrorCodes.INSUFFICIENT_FUNDS,
          'Insufficient balance',
          400
        ) as AppError & {
          metadata?: { userId: string; attemptedAmount: number; availableBalance: number };
        };
        insufficientError.metadata = {
          userId: senderId,
          attemptedAmount: amount,
          availableBalance: currentBalance,
        };
        throw insufficientError;
      }

      const createOptions = session ? { session } : undefined;
      const escrowDocs = await SafeSendEscrowModel.create(
        [
          {
            senderId,
            merchantId,
            amount,
            goal,
            status: 'awaiting_proof',
            lockReason,
          },
        ],
        createOptions
      );

      const [transaction] = await TransactionModel.create(
        [
          {
            userId: senderId,
            type: TRANSACTION_TYPE.SAFESEND_ESCROW,
            amount,
            counterparty: merchant.phoneE164,
            stateCode: sender.stateCode,
            status: TRANSACTION_STATUS.SUCCESS,
          },
        ],
        createOptions
      );

      const balanceAfter = await adjustUserBalanceWithHistory({
        userId: senderId,
        delta: -amount,
        amount,
        transactionType: TRANSACTION_TYPE.SAFESEND_ESCROW,
        entryType: 'debit',
        counterparty: merchant.phoneE164,
        description: `SafeSend escrow for ${merchant.name}`,
        transactionId: transaction._id.toString(),
        timestamp: transaction.createdAt,
        riskLevel: classifyRiskLevel(amount),
        session,
      });

      return {
        escrow: escrowDocs[0],
        senderPhone: sender.phoneE164,
        merchantPhone: merchant.phoneE164,
        merchantName: merchant.name,
        totalMoney: balanceAfter,
      };
    });

    await smsProvider.send(
      senderPhone,
      `SafeSend: ₹${amount} locked for ${merchantName}. Merchant will submit proof soon. Ref: ${escrow._id}`
    );

    await smsProvider.send(
      merchantPhone,
      `SafeSend: ${senderPhone} sent ₹${amount} for ${goal}. Submit proof to receive funds. Ref: ${escrow._id}`
    );

    await recomputeAndSaveScore(senderId);

    return { escrow, totalMoney };
  } catch (error) {
    if (error instanceof AppError && error.code === ErrorCodes.INSUFFICIENT_FUNDS) {
      const metadata = (error as AppError & {
        metadata?: { userId?: string; attemptedAmount: number; availableBalance: number };
      }).metadata;

      if (metadata) {
        await recordOverdraftEvent({
          userId: metadata.userId ?? senderId,
          attemptedAmount: metadata.attemptedAmount,
          availableBalance: metadata.availableBalance,
        });

        try {
          await recomputeAndSaveScore(metadata.userId ?? senderId);
        } catch (scoreError) {
          console.error('Failed to recompute score after SafeSend overdraft', scoreError);
        }
      }
    }

    throw error;
  }
}

export async function submitProof(
  merchantId: string,
  escrowId: string,
  proofUrl: string,
  description?: string
) {
  const escrow = await SafeSendEscrowModel.findById(escrowId);
  if (!escrow) throw new AppError(ErrorCodes.NOT_FOUND, 'Escrow not found', 404);

  if (escrow.merchantId !== merchantId) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'You are not authorized to submit proof for this escrow', 403);
  }

  if (escrow.status !== 'awaiting_proof') {
    throw new AppError(ErrorCodes.INVALID_INPUT, `Cannot submit proof when status is ${escrow.status}`, 400);
  }

  const proof = await SafeSendProofModel.create({
    escrowId,
    merchantId,
    proofUrl,
    description,
    status: 'pending',
  });

  // Update escrow status
  escrow.status = 'under_review';
  await escrow.save();

  // Notify sender
  const sender = await UserModel.findById(escrow.senderId);
  if (sender) {
    await smsProvider.send(
      sender.phoneE164,
      `SafeSend: Merchant submitted proof for ₹${escrow.amount}. Under review. Ref: ${escrow._id}`
    );
  }

  return proof;
}

export async function reviewProof(
  reviewerId: string,
  proofId: string,
  approved: boolean,
  rejectionReason?: string
) {
  const proof = await SafeSendProofModel.findById(proofId);
  if (!proof) throw new AppError(ErrorCodes.NOT_FOUND, 'Proof not found', 404);

  if (proof.status !== 'pending') {
    throw new AppError(ErrorCodes.INVALID_INPUT, `Proof already ${proof.status}`, 400);
  }

  const escrow = await SafeSendEscrowModel.findById(proof.escrowId);
  if (!escrow) throw new AppError(ErrorCodes.NOT_FOUND, 'Escrow not found', 404);

  proof.status = approved ? 'approved' : 'rejected';
  proof.reviewedBy = reviewerId;
  proof.reviewedAt = new Date();
  if (!approved && rejectionReason) {
    proof.rejectionReason = rejectionReason;
  }
  await proof.save();

  if (approved) {
    // Release funds
    escrow.status = 'released';
    escrow.releasedAt = new Date();
    await escrow.save();

    // Create release transaction
    const merchant = await MerchantModel.findById(escrow.merchantId);
    const sender = await UserModel.findById(escrow.senderId);

    if (sender) {
      await TransactionModel.create({
        userId: escrow.senderId,
        type: TRANSACTION_TYPE.SAFESEND_RELEASE,
        amount: escrow.amount,
        counterparty: merchant?.phoneE164,
        stateCode: sender.stateCode,
        status: TRANSACTION_STATUS.SUCCESS,
      });
    }

    // Notify both parties
    if (sender) {
      await smsProvider.send(
        sender.phoneE164,
        `SafeSend: ₹${escrow.amount} released to ${merchant?.name}. Proof verified. Ref: ${escrow._id}`
      );
    }

    if (merchant) {
      await smsProvider.send(
        merchant.phoneE164,
        `SafeSend: ₹${escrow.amount} released! Proof approved. Ref: ${escrow._id}`
      );
    }
  } else {
    // Reject proof - merchant needs to resubmit
    escrow.status = 'awaiting_proof';
    await escrow.save();

    const merchant = await MerchantModel.findById(escrow.merchantId);
    const sender = await UserModel.findById(escrow.senderId);

    if (merchant) {
      await smsProvider.send(
        merchant.phoneE164,
        `SafeSend: Proof rejected for ₹${escrow.amount}. Reason: ${rejectionReason}. Please resubmit. Ref: ${escrow._id}`
      );
    }

    if (sender) {
      await smsProvider.send(
        sender.phoneE164,
        `SafeSend: Proof rejected for ₹${escrow.amount}. Waiting for merchant to resubmit. Ref: ${escrow._id}`
      );
    }
  }

  return { proof, escrow };
}

export async function refundEscrow(escrowId: string, adminId: string) {
  const {
    escrow,
    senderPhone,
    merchantPhone,
    totalMoney,
  } = await withTransaction(async session => {
    const escrowQuery = SafeSendEscrowModel.findById(escrowId);
    if (session) {
      escrowQuery.session(session);
    }
    const escrow = await escrowQuery;
    if (!escrow) throw new AppError(ErrorCodes.NOT_FOUND, 'Escrow not found', 404);

    if (escrow.status === 'released' || escrow.status === 'refunded') {
      throw new AppError(
        ErrorCodes.INVALID_INPUT,
        `Cannot refund escrow with status ${escrow.status}`,
        400
      );
    }

    escrow.status = 'refunded';
    escrow.refundedAt = new Date();
    if (session) {
      await escrow.save({ session });
    } else {
      await escrow.save();
    }

    const senderQuery = UserModel.findById(escrow.senderId);
    if (session) {
      senderQuery.session(session);
    }
    const sender = await senderQuery;
    if (!sender) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Sender not found', 404);
    }

    const createOptions = session ? { session } : undefined;
    const [transaction] = await TransactionModel.create(
      [
        {
          userId: escrow.senderId,
          type: TRANSACTION_TYPE.SAFESEND_REFUND,
          amount: escrow.amount,
          stateCode: sender.stateCode,
          status: TRANSACTION_STATUS.SUCCESS,
        },
      ],
      createOptions
    );

    const balanceAfter = await adjustUserBalanceWithHistory({
      userId: escrow.senderId,
      delta: escrow.amount,
      amount: escrow.amount,
      transactionType: TRANSACTION_TYPE.SAFESEND_REFUND,
      entryType: 'credit',
      description: 'SafeSend refund',
      transactionId: transaction._id.toString(),
      timestamp: transaction.createdAt,
      riskLevel: classifyRiskLevel(escrow.amount),
      session,
    });

    const merchantQuery = MerchantModel.findById(escrow.merchantId);
    if (session) {
      merchantQuery.session(session);
    }
    const merchant = await merchantQuery;

    return {
      escrow,
      senderPhone: sender.phoneE164,
      merchantPhone: merchant?.phoneE164,
      totalMoney: balanceAfter,
    };
  });

  await smsProvider.send(
    senderPhone,
    `SafeSend: ₹${escrow.amount} refunded to your account. Ref: ${escrow._id}`
  );

  if (merchantPhone) {
    await smsProvider.send(
      merchantPhone,
      `SafeSend: Escrow ₹${escrow.amount} has been refunded to sender. Ref: ${escrow._id}`
    );
  }

  await recomputeAndSaveScore(escrow.senderId);

  return { escrow, totalMoney };
}

export async function getEscrowsByUser(userId: string, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  const escrows = await SafeSendEscrowModel.find({ senderId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await SafeSendEscrowModel.countDocuments({ senderId: userId });

  return {
    escrows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getEscrowsByMerchant(merchantId: string, limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  const escrows = await SafeSendEscrowModel.find({ merchantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const total = await SafeSendEscrowModel.countDocuments({ merchantId });

  return {
    escrows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getPendingProofs(limit = 20, page = 1) {
  const skip = (page - 1) * limit;
  const proofs = await SafeSendProofModel.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .skip(skip);

  const total = await SafeSendProofModel.countDocuments({ status: 'pending' });

  return {
    proofs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function getMerchants(stateCode?: string, verified?: boolean, limit = 50) {
  const query: any = {};
  if (stateCode) query.stateCode = stateCode;
  if (verified !== undefined) query.verified = verified;

  const merchants = await MerchantModel.find(query).sort({ name: 1 }).limit(limit);

  return merchants;
}

export async function createMerchant(
  name: string,
  phoneE164: string,
  category: string,
  stateCode: string
) {
  const merchant = await MerchantModel.create({
    name,
    phoneE164,
    category,
    stateCode,
    verified: false,
  });

  return merchant;
}

export async function verifyMerchant(merchantId: string, adminId: string) {
  const merchant = await MerchantModel.findById(merchantId);
  if (!merchant) throw new AppError(ErrorCodes.NOT_FOUND, 'Merchant not found', 404);

  merchant.verified = true;
  await merchant.save();

  // Notify merchant
  await smsProvider.send(
    merchant.phoneE164,
    `SafeSend: Your merchant account "${merchant.name}" is now verified! You can receive SafeSend payments.`
  );

  return merchant;
}

