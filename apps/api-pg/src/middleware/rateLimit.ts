import rateLimit from 'express-rate-limit';

export const generalRateLimit = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRateLimit = rateLimit({
  windowMs: 60_000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

