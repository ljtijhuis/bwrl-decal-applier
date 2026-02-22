import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { healthRouter } from './routes/health.js';
import { configRouter } from './routes/config.js';
import { applyRouter, multerErrorHandler } from './routes/apply.js';
import { globalLimiter, applyLimiter } from './middleware/rateLimiter.js';

export const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',');
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
}));
app.use(express.json());
app.use(globalLimiter);

app.use('/health', healthRouter);
app.use('/api/config', configRouter);
app.use('/api/apply', applyLimiter, applyRouter);

app.use(multerErrorHandler);

const PORT = process.env.PORT ?? 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
