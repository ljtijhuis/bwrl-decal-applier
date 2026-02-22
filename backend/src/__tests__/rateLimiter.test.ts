import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

function makeApp(max: number) {
  const app = express();
  app.use(
    rateLimit({
      windowMs: 60_000,
      max,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later.' },
    }),
  );
  app.get('/test', (_req: Request, res: Response) => res.json({ ok: true }));
  return app;
}

describe('rate limiting middleware', () => {
  it('allows requests within the limit', async () => {
    const app = makeApp(3);
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 429 after exceeding the limit', async () => {
    const app = makeApp(2);
    await request(app).get('/test');
    await request(app).get('/test');
    const res = await request(app).get('/test');
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/too many requests/i);
  });

  it('sets a RateLimit response header', async () => {
    const app = makeApp(5);
    const res = await request(app).get('/test');
    // draft-7 sends a combined RateLimit header
    expect(res.headers['ratelimit']).toBeDefined();
  });
});
