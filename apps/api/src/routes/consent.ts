import { Router } from 'express';
import { CreateConsentSchema, CONSENT_VALIDITY_DAYS } from '@sarathi/shared';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { ConsentModel } from '../models/Consent.js';
import { signConsentToken } from '../utils/jwt.js';

const router = Router();

router.use(authenticateUser);

router.post('/', validateBody(CreateConsentSchema), async (req: AuthRequest, res, next) => {
  try {
    const { purpose } = req.body;
    const userId = req.user!.userId;

    const issuedAt = new Date();
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + CONSENT_VALIDITY_DAYS);

    const tokenJWT = signConsentToken({
      userId,
      purpose,
      issuedAt,
      validTill,
    });

    const consent = await ConsentModel.create({
      userId,
      purpose,
      tokenJWT,
      validTill,
      revoked: false,
    });

    res.json({
      consentId: consent._id.toString(),
      tokenPreview: tokenJWT.substring(0, 50) + '...',
      validTill,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const consents = await ConsentModel.find({ userId: req.user!.userId }).sort({ createdAt: -1 });

    res.json({
      consents: consents.map(c => ({
        consentId: c._id.toString(),
        purpose: c.purpose,
        validTill: c.validTill,
        revoked: c.revoked,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

