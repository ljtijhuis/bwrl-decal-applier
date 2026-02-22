import rateLimit from 'express-rate-limit';

const skip = () => process.env.NODE_ENV === 'test';
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Global rate limiter applied to all routes.
 * Protects the server from basic flooding of lightweight endpoints.
 * Configurable via RATE_LIMIT_GLOBAL env var (default: 200).
 */
export const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_GLOBAL ?? 200),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip,
});

/**
 * Stricter rate limiter for POST /api/apply.
 * Image compositing is CPU/memory intensive.
 * Configurable via RATE_LIMIT_APPLY env var (default: 20).
 */
export const applyLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_APPLY ?? 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many apply requests. Please wait before submitting another livery.' },
  skip,
});
