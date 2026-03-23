import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', analyticsController.getDashboard);

export default router;

