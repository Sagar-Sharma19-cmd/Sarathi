import { Router } from 'express';
import { otpRateLimit } from '../middleware/rateLimit';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/otp/send', otpRateLimit, authController.sendOtp);
router.post('/otp/verify', authController.verifyOtpAndLogin);

export default router;

