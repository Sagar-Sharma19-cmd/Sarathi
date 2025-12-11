import { Router } from 'express';
import { z } from 'zod';
import { authenticateUser, AuthRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validateRequest.js';
import { getChatResponse } from '../services/aiChat.js';

const router = Router();

const ChatSchema = z.object({
  message: z.string().min(1).max(500),
  language: z.enum(['en', 'hi']).optional().default('en'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

router.post('/message', authenticateUser, validateBody(ChatSchema), async (req: AuthRequest, res, next) => {
  try {
    const { message, language, history } = req.body;
    const userId = req.user!.userId;

    const response = await getChatResponse(userId, message, language as 'en' | 'hi', history as any);

    res.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;

