import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as otpService from '../services/otpService';
import * as authService from '../services/authService';

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/),
  otp: z.string().length(6),
});

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = sendOtpSchema.parse(req.body);
    await otpService.sendOtp(phone, req.ip, req.headers['user-agent']);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtpAndLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const result = await authService.loginWithOtp(phone, otp, req.ip, req.headers['user-agent']);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

