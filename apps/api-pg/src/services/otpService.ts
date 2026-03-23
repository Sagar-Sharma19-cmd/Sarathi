import { redis } from '../config/redis';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

const otpKey = (phone: string) => `otp:${phone}`;
const otpCountKey = (phone: string, date: string) => `otp_count:${phone}:${date}`;

export async function sendOtp(phone: string, ip?: string, userAgent?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const countKey = otpCountKey(phone, today);

  const currentCount = parseInt((await redis.get(countKey)) || '0', 10);
  if (currentCount >= env.OTP_MAX_PER_DAY) {
    throw new AppError('OTP_LIMIT_REACHED', 'OTP limit reached for today', 429);
  }

  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const ttl = env.OTP_TTL_SECONDS;

  await redis
    .multi()
    .setEx(otpKey(phone), ttl, otp)
    .incr(countKey)
    .expire(countKey, 24 * 3600)
    .exec();

  await prisma.otpLog.create({
    data: {
      phone,
      otpCode: otp,
      purpose: 'login',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttl * 1000),
      ipAddress: ip,
      userAgent,
    },
  });

  logger.info({ phone }, 'OTP generated (wire SMS provider here)');
}

export async function verifyOtp(phone: string, otp: string, ip?: string, userAgent?: string) {
  const key = otpKey(phone);
  const cached = await redis.get(key);
  if (!cached) {
    await prisma.otpLog.updateMany({
      where: { phone, otpCode: otp, verifiedAt: null },
      data: { isValid: false },
    });
    throw new AppError('OTP_EXPIRED', 'OTP expired or invalid', 400);
  }

  if (cached !== otp) {
    throw new AppError('OTP_INVALID', 'Invalid OTP', 400);
  }

  await redis.del(key);

  await prisma.otpLog.updateMany({
    where: { phone, otpCode: otp, verifiedAt: null },
    data: { verifiedAt: new Date(), isValid: true, ipAddress: ip, userAgent },
  });
}

