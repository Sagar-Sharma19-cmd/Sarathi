import { Router } from 'express';
import { UpdateStateSchema, UpdateLanguageSchema } from '@sarathi/shared';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { UserModel } from '../models/User.js';
import { LoanModel } from '../models/Loan.js';
import { getLatestScore } from '../services/scoring.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

const router = Router();

router.use(authenticateUser);

router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    const latestScore = await getLatestScore(user._id.toString());
    const activeLoan = await LoanModel.findOne({
      userId: user._id.toString(),
      status: { $in: ['approved', 'disbursed'] },
    });

    const historyEntries = (user.transactionHistory ?? [])
      .slice(-20)
      .map(entry => entry.toObject?.() ?? entry)
      .reverse();

    res.json({
      user: {
        userId: user._id.toString(),
        phoneE164: user.phoneE164,
        sarathiId: user.sarathiId,
        preferredLang: user.preferredLang,
        stateCode: user.stateCode,
        kycStatus: user.kycStatus,
        isAdmin: user.isAdmin,
        totalMoney: typeof user.totalMoney === 'number' ? user.totalMoney : 5000,
        transactionHistory: historyEntries,
      },
      latestScore,
      activeLoan: activeLoan
        ? {
            loanId: activeLoan._id.toString(),
            principal: activeLoan.principal,
            apr: activeLoan.apr,
            termDays: activeLoan.termDays,
            status: activeLoan.status,
            disbursedAt: activeLoan.disbursedAt,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/state', validateBody(UpdateStateSchema), async (req: AuthRequest, res, next) => {
  try {
    const { stateCode } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.user!.userId,
      { stateCode },
      { new: true }
    );

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    res.json({ stateCode: user.stateCode });
  } catch (error) {
    next(error);
  }
});

router.post('/language', validateBody(UpdateLanguageSchema), async (req: AuthRequest, res, next) => {
  try {
    const { preferredLang } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.user!.userId,
      { preferredLang },
      { new: true }
    );

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }

    res.json({ preferredLang: user.preferredLang });
  } catch (error) {
    next(error);
  }
});

export default router;

