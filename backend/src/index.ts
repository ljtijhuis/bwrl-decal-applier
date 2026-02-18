import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { healthRouter } from './routes/health.js';
import { configRouter } from './routes/config.js';
import { applyRouter, multerErrorHandler } from './routes/apply.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/config', configRouter);
app.use('/api/apply', applyRouter);

app.use(multerErrorHandler);

const PORT = process.env.PORT ?? 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
