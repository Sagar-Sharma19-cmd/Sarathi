import { Router, type Router as ExpressRouter } from 'express';
import express from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { CreatePaymentOrderSchema, VerifyRazorpayPaymentSchema } from '@sarathi/shared';
import { verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../services/payments/razorpay.js';
import { createPaymentOrder, markPaymentPaidAndApplyEffects } from '../services/payments/payments.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

const router: ExpressRouter = Router();

router.post('/create-order', authenticateUser, validateBody(CreatePaymentOrderSchema), async (req: AuthRequest, res, next) => {
  try {
    const { purpose, amount, loanId, merchantId, goal, lockReason } = req.body as any;

    const result = await createPaymentOrder({
      userId: req.user!.userId,
      purpose,
      amount,
      loanId,
      safesend: purpose === 'safesend_deposit' ? { merchantId, goal, lockReason } : undefined,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/verify', authenticateUser, validateBody(VerifyRazorpayPaymentSchema), async (req: AuthRequest, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as any;

    const ok = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!ok) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid payment signature', 401);
    }

    const applied = await markPaymentPaidAndApplyEffects({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      source: 'client_verify',
    });

    res.json(applied);
  } catch (error) {
    next(error);
  }
});

// Webhook endpoint (needs raw body, mounted with express.raw in app.ts)
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.header('x-razorpay-signature');
    if (!signature) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Missing Razorpay signature', 401);
    }

    const raw = req.body as Buffer;
    const ok = verifyRazorpayWebhookSignature(raw, signature);
    if (!ok) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 'Invalid webhook signature', 401);
    }

    const event = JSON.parse(raw.toString('utf8')) as any;
    const eventName = event?.event as string | undefined;

    // We care primarily about captured/paid payments.
    if (eventName === 'payment.captured' || eventName === 'order.paid') {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderEntity = event?.payload?.order?.entity;

      const orderId: string | undefined = paymentEntity?.order_id ?? orderEntity?.id;
      const paymentId: string | undefined = paymentEntity?.id;

      if (orderId && paymentId) {
        await markPaymentPaidAndApplyEffects({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          source: 'webhook',
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;

