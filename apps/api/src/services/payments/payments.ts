import { PaymentModel, type PaymentPurpose } from '../../models/Payment.js';
import { UserModel } from '../../models/User.js';
import { AppError, ErrorCodes } from '../../utils/errors.js';
import { withTransaction } from '../finance.js';
import { getRazorpayClient } from './razorpay.js';
import { creditWallet } from '../wallet.js';
import { repayLoanFromWallet } from '../loanRepayment.js';
import * as safeSendService from '../safesend.js';
import { env } from '../../config/env.js';

export async function createPaymentOrder(options: {
  userId: string;
  purpose: PaymentPurpose;
  amount: number;
  loanId?: string;
  safesend?: { merchantId: string; goal: string; lockReason?: string };
}) {
  const { userId, purpose, amount, loanId, safesend } = options;

  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);

  if (purpose === 'loan_repay' && !loanId) {
    throw new AppError(ErrorCodes.INVALID_INPUT, 'loanId is required', 400);
  }
  if (purpose === 'safesend_deposit' && (!safesend?.merchantId || !safesend.goal)) {
    throw new AppError(ErrorCodes.INVALID_INPUT, 'merchantId and goal are required', 400);
  }

  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: 'INR',
    receipt: `sarathi_${purpose}_${Date.now()}`,
    notes: {
      userId,
      purpose,
      loanId: loanId ?? '',
      merchantId: safesend?.merchantId ?? '',
    },
  });

  const payment = await PaymentModel.create({
    userId,
    purpose,
    amount,
    currency: 'INR',
    status: 'created',
    razorpayOrderId: order.id,
    loanId,
    safesend,
    notes: { stateCode: user.stateCode },
  });

  return {
    paymentId: payment._id.toString(),
    razorpayOrderId: order.id,
    amount,
    currency: 'INR' as const,
    keyId: env.RAZORPAY_KEY_ID,
  };
}

export async function markPaymentPaidAndApplyEffects(options: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  source: 'client_verify' | 'webhook';
}) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, source } = options;

  return withTransaction(async session => {
    const paymentQuery = PaymentModel.findOne({ razorpayOrderId });
    if (session) paymentQuery.session(session);
    const payment = await paymentQuery;
    if (!payment) throw new AppError(ErrorCodes.NOT_FOUND, 'Payment not found', 404);

    // Idempotency: if already paid and wallet top-up recorded, just return.
    if (payment.status === 'paid' && payment.walletTopupTransactionId) {
      return {
        status: 'paid' as const,
        paymentId: payment._id.toString(),
        purpose: payment.purpose,
        escrowId: payment.escrowId,
        walletTopupTransactionId: payment.walletTopupTransactionId,
      };
    }

    // Mark attempted/paid fields early for audit
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpayPaymentId;
    if (razorpaySignature) payment.razorpaySignature = razorpaySignature;
    payment.paidAt = new Date();
    payment.notes = { ...(payment.notes ?? {}), source };

    const userQuery = UserModel.findById(payment.userId);
    if (session) userQuery.session(session);
    const user = await userQuery;
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);

    // Step 1: credit wallet so existing business rules (repay/escrow) can run unchanged
    const topup = await creditWallet({
      userId: payment.userId,
      amount: payment.amount,
      stateCode: user.stateCode,
      description: `Razorpay ${payment.purpose} top-up`,
      counterparty: 'razorpay',
      session,
    });
    payment.walletTopupTransactionId = topup.transactionId;

    // Step 2: apply purpose-specific action (net wallet effect may be 0)
    if (payment.purpose === 'loan_repay') {
      if (!payment.loanId) throw new AppError(ErrorCodes.INVALID_INPUT, 'Payment missing loanId', 400);
      await repayLoanFromWallet({ userId: payment.userId, loanId: payment.loanId, amount: payment.amount, session });
    }

    if (payment.purpose === 'safesend_deposit') {
      if (!payment.safesend?.merchantId || !payment.safesend.goal) {
        throw new AppError(ErrorCodes.INVALID_INPUT, 'Payment missing SafeSend details', 400);
      }
      const { escrow } = await safeSendService.createEscrow(
        payment.userId,
        payment.safesend.merchantId,
        payment.amount,
        payment.safesend.goal,
        payment.safesend.lockReason
      );
      payment.escrowId = escrow._id.toString();
    }

    if (session) await payment.save({ session });
    else await payment.save();

    return {
      status: 'paid' as const,
      paymentId: payment._id.toString(),
      purpose: payment.purpose,
      escrowId: payment.escrowId,
      walletTopupTransactionId: payment.walletTopupTransactionId,
    };
  });
}

