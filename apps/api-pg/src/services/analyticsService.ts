import { prisma } from '../config/db';
import { redis } from '../config/redis';

export async function getDashboardMetrics() {
  const cacheKey = 'analytics:dashboard';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as unknown;

  const [totalUsers, dailySignups, otpCount, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
    }),
    prisma.otpLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
    }),
    prisma.session.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
    }),
  ]);

  const result = {
    totalUsers,
    dailySignups,
    otpRequests24h: otpCount,
    activeUsers7d: activeUsers,
  };

  await redis.setEx(cacheKey, 60, JSON.stringify(result));
  return result;
}

