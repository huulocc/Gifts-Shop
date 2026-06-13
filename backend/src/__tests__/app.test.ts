import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

describe('GiftShop backend scaffold', () => {
  const app = createApp();

  it('returns health status', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual({
      data: {
        status: 'ok',
        service: 'giftshop-backend',
        stack: 'express-typescript-prisma',
      },
    });
  });

  it('returns a standard 404 envelope for unknown routes', async () => {
    const response = await request(app).get('/missing-route').expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.fields).toEqual({});
  });

  it('returns a standard 501 envelope for wired but unimplemented public routes', async () => {
    const response = await request(app).get('/api/products').expect(501);

    expect(response.body.error.code).toBe('NOT_IMPLEMENTED');
    expect(response.body.error.fields).toEqual({});
  });

  it('validates the register payload before reaching business logic', async () => {
    const response = await request(app).post('/api/auth/register').send({}).expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toHaveProperty('email');
  });

  it('validates the login payload before reaching business logic', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' })
      .expect(422);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects /me without a session token', async () => {
    const response = await request(app).get('/api/auth/me').expect(401);

    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects unauthenticated manager revenue access', async () => {
    const response = await request(app).get('/api/reports/revenue').expect(401);

    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects unauthenticated manager order status updates before validation reaches business logic', async () => {
    const response = await request(app)
      .patch('/api/orders/order-1/status')
      .send({ orderStatus: 'completed' })
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});
