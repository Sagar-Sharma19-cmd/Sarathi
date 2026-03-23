import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { verifyOtp } from './otpService';
import { AppError } from '../utils/errors';

export async function loginWithOtp(phone: string, otp: string, ip?: string, ua?: string) {
  await verifyOtp(phone, otp, ip, ua);

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    user = await prisma.user.create({
      data: { phone, role: 'USER', status: 'ACTIVE' },
    });
  }

  if (user.status === 'BLOCKED') {
    throw new AppError('USER_BLOCKED', 'User is blocked', 403);
  }

  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' },
  );
  const refreshToken = jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' },
  );

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      ipAddress: ip,
      userAgent: ua,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  await prisma.loginLog.create({
    data: {
      userId: user.id,
      phone,
      success: true,
      ipAddress: ip,
      userAgent: ua,
    },
  });

  return { user, accessToken, refreshToken };
}

