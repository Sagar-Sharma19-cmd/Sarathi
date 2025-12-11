import { Router } from 'express';
import { authenticateUser, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validateRequest.js';
import {
  CreateSafeSendSchema,
  SubmitProofSchema,
  ReviewProofSchema,
  RefundEscrowSchema,
  PaginationSchema,
  CreateMerchantSchema,
} from '@sarathi/shared';
import * as safeSendService from '../services/safesend.js';
import { SafeSendEscrowModel } from '../models/SafeSendEscrow.js';
import { SafeSendProofModel } from '../models/SafeSendProof.js';
import { MerchantModel } from '../models/Merchant.js';

const router = Router();

// Get merchants
router.get('/merchants', authenticateUser, async (req: AuthRequest, res, next) => {
  try {
    const { stateCode, verified } = req.query;
    const merchants = await safeSendService.getMerchants(
      stateCode as string | undefined,
      verified === 'true' ? true : verified === 'false' ? false : undefined
    );
    res.json({ merchants });
  } catch (error) {
    next(error);
  }
});

// Create merchant (admin only)
router.post(
  '/merchants',
  authenticateUser,
  requireAdmin,
  validateBody(CreateMerchantSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { name, phoneE164, category, stateCode } = req.body;
      const merchant = await safeSendService.createMerchant(name, phoneE164, category, stateCode);
      res.status(201).json({ merchant });
    } catch (error) {
      next(error);
    }
  }
);

// Verify merchant (admin only)
router.post('/merchants/:merchantId/verify', authenticateUser, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { merchantId } = req.params;
    const merchant = await safeSendService.verifyMerchant(merchantId, req.user!.userId);
    res.json({ merchant });
  } catch (error) {
    next(error);
  }
});

// Create SafeSend escrow
router.post(
  '/escrow',
  authenticateUser,
  validateBody(CreateSafeSendSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { merchantId, amount, goal, lockReason } = req.body;
      const { escrow, totalMoney } = await safeSendService.createEscrow(
        req.user!.userId,
        merchantId,
        amount,
        goal,
        lockReason
      );
      res.status(201).json({ escrow, totalMoney });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's escrows
router.get(
  '/escrow/my',
  authenticateUser,
  validateQuery(PaginationSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { page, limit } = req.query as any;
      const result = await safeSendService.getEscrowsByUser(req.user!.userId, limit, page);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get merchant's escrows (merchant or admin)
router.get(
  '/escrow/merchant/:merchantId',
  authenticateUser,
  validateQuery(PaginationSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { merchantId } = req.params;
      const { page, limit } = req.query as any;

      // Verify merchant exists and user has access
      const merchant = await MerchantModel.findById(merchantId);
      if (!merchant) {
        return res.status(404).json({ error: 'Merchant not found' });
      }

      // Allow if admin or if merchant's phone matches user's phone
      const isAdmin = req.user!.isAdmin;
      const isMerchant = merchant.phoneE164 === req.user!.phoneE164;

      if (!isAdmin && !isMerchant) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const result = await safeSendService.getEscrowsByMerchant(merchantId, limit, page);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get single escrow details
router.get('/escrow/:escrowId', authenticateUser, async (req: AuthRequest, res, next) => {
  try {
    const { escrowId } = req.params;
    const escrow = await SafeSendEscrowModel.findById(escrowId);

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check authorization
    const isOwner = escrow.senderId === req.user!.userId;
    const merchant = await MerchantModel.findById(escrow.merchantId);
    const isMerchant = merchant?.phoneE164 === req.user!.phoneE164;
    const isAdmin = req.user!.isAdmin;

    if (!isOwner && !isMerchant && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get associated proofs
    const proofs = await SafeSendProofModel.find({ escrowId }).sort({ createdAt: -1 });

    res.json({ escrow, proofs, merchant });
  } catch (error) {
    next(error);
  }
});

// Submit proof (merchant)
router.post(
  '/proof',
  authenticateUser,
  validateBody(SubmitProofSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { escrowId, proofUrl, description } = req.body;

      // Find escrow and verify merchant access
      const escrow = await SafeSendEscrowModel.findById(escrowId);
      if (!escrow) {
        return res.status(404).json({ error: 'Escrow not found' });
      }

      const merchant = await MerchantModel.findById(escrow.merchantId);
      if (!merchant || merchant.phoneE164 !== req.user!.phoneE164) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const proof = await safeSendService.submitProof(
        escrow.merchantId,
        escrowId,
        proofUrl,
        description
      );

      res.status(201).json({ proof });
    } catch (error) {
      next(error);
    }
  }
);

// Get pending proofs (admin only)
router.get(
  '/proof/pending',
  authenticateUser,
  requireAdmin,
  validateQuery(PaginationSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { page, limit } = req.query as any;
      const result = await safeSendService.getPendingProofs(limit, page);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Review proof (admin only)
router.post(
  '/proof/review',
  authenticateUser,
  requireAdmin,
  validateBody(ReviewProofSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { proofId, approved, rejectionReason } = req.body;
      const result = await safeSendService.reviewProof(
        req.user!.userId,
        proofId,
        approved,
        rejectionReason
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Refund escrow (admin only)
router.post(
  '/escrow/refund',
  authenticateUser,
  requireAdmin,
  validateBody(RefundEscrowSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { escrowId } = req.body;
      const { escrow, totalMoney } = await safeSendService.refundEscrow(escrowId, req.user!.userId);
      res.json({ escrow, totalMoney });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

