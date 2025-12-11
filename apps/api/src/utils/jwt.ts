import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JWT_EXPIRY } from '@sarathi/shared';

export interface JWTPayload {
  userId: string;
  sarathiId: string;
  phoneE164: string;
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'api',
    audience: 'sarathi',
    algorithm: 'HS256',
  });
}

export function verifyJWT(token: string): JWTPayload {
  const payload = jwt.verify(token, env.JWT_SECRET, {
    issuer: 'api',
    audience: 'sarathi',
    algorithms: ['HS256'],
  }) as JWTPayload;
  return payload;
}

export function signConsentToken(payload: {
  userId: string;
  purpose: string;
  issuedAt: Date;
  validTill: Date;
}): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '180d',
    issuer: 'api',
    audience: 'consent',
    algorithm: 'HS256',
  });
}

