import { redisClient } from '../config/redis.js';
import {
  OTP_SEND_LIMIT,
  OTP_VERIFY_LIMIT,
  OTP_RESEND_COOLDOWN,
} from '@sarathi/shared';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { smsProvider } from './sms/index.js';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTPKey(phoneE164: string): string {
  return `otp:${phoneE164}`;
}

function getSendCountKey(phoneE164: string): string {
  return `otp:send:${phoneE164}`;
}

function getVerifyCountKey(phoneE164: string): string {
  return `otp:verify:${phoneE164}`;
}

function getCooldownKey(phoneE164: string): string {
  return `otp:cooldown:${phoneE164}`;
}

export async function sendOTP(phoneE164: string): Promise<void> {
  // Check cooldown
  const cooldown = await redisClient.get(getCooldownKey(phoneE164));
  if (cooldown) {
    throw new AppError(
      ErrorCodes.OTP_COOLDOWN,
      `Please wait ${OTP_RESEND_COOLDOWN} seconds before requesting another OTP`,
      429
    );
  }

  // Check daily send limit
  const sendCount = await redisClient.get(getSendCountKey(phoneE164));
  if (sendCount && parseInt(sendCount, 10) >= OTP_SEND_LIMIT) {
    throw new AppError(
      ErrorCodes.OTP_SEND_LIMIT,
      'Daily OTP send limit exceeded',
      429
    );
  }

  // Generate and store OTP
  const otp = generateOTP();
  await redisClient.setEx(getOTPKey(phoneE164), 600, otp); // 10 minutes expiry

  // Increment send count (24-hour TTL)
  const newSendCount = sendCount ? parseInt(sendCount, 10) + 1 : 1;
  await redisClient.setEx(getSendCountKey(phoneE164), 86400, newSendCount.toString());

  // Set cooldown
  await redisClient.setEx(getCooldownKey(phoneE164), OTP_RESEND_COOLDOWN, '1');

  // Send SMS
  const message = `Your Sarathi OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`;
  await smsProvider.send(phoneE164, message);
}

export async function verifyOTP(phoneE164: string, code: string): Promise<boolean> {
  // Check daily verify limit
  const verifyCount = await redisClient.get(getVerifyCountKey(phoneE164));
  if (verifyCount && parseInt(verifyCount, 10) >= OTP_VERIFY_LIMIT) {
    throw new AppError(
      ErrorCodes.OTP_VERIFY_LIMIT,
      'Daily OTP verification limit exceeded',
      429
    );
  }

  // Get stored OTP
  const storedOTP = await redisClient.get(getOTPKey(phoneE164));
  if (!storedOTP) {
    throw new AppError(ErrorCodes.INVALID_OTP, 'OTP expired or not found', 400);
  }

  // Increment verify count (24-hour TTL)
  const newVerifyCount = verifyCount ? parseInt(verifyCount, 10) + 1 : 1;
  await redisClient.setEx(getVerifyCountKey(phoneE164), 86400, newVerifyCount.toString());

  // Verify OTP
  if (storedOTP !== code) {
    throw new AppError(ErrorCodes.INVALID_OTP, 'Invalid OTP', 400);
  }

  // Delete OTP after successful verification
  await redisClient.del(getOTPKey(phoneE164));

  return true;
}

