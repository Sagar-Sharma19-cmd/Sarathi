import { Router } from 'express';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { getLatestScore } from '../services/scoring.js';
import { ScoreModel } from '../models/Score.js';

const router = Router();

router.use(authenticateUser);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const latestScore = await getLatestScore(userId);

    // Get score history
    const scoreHistory = await ScoreModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      current: latestScore,
      history: scoreHistory.map(s => ({
        score: s.score,
        band: s.band,
        reasonCodes: s.reasonCodes,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

