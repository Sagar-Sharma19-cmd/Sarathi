import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { connectRedis, disconnectRedis } from '../config/redis.js';

describe('Auth Routes', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await connectDatabase();
    await connectRedis();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
    await disconnectRedis();
  });

  it('should send OTP for valid phone number', async () => {
    const response = await request(app)
      .post('/auth/otp/send')
      .send({ phoneE164: '+919876543210' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
  });

  it('should reject invalid phone number', async () => {
    const response = await request(app)
      .post('/auth/otp/send')
      .send({ phoneE164: 'invalid' });

    expect(response.status).toBe(400);
  });
});

