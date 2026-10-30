import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { initializeDatabase } from './db/database';
import healthRouter from './routes/health';
import endpointsRouter from './routes/endpoints';
import measurementsRouter from './routes/measurements';
import dashboardRouter from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

async function main() {
  // Initialize DB before starting server
  await initializeDatabase();

  const app = express();

  // Security & compression
  app.use(helmet());
  app.use(compression() as express.RequestHandler);
  app.use(morgan('dev'));

  // CORS
  app.use(cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  }));

  // Body parsing
  app.use(express.json({ limit: '512kb' }));
  app.use(express.urlencoded({ extended: false }));

  // Rate limiting on measurement submission
  const measurementLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
  });

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/endpoints', endpointsRouter);
  app.use('/api/measurements', measurementLimiter, measurementsRouter);
  app.use('/api/dashboard', dashboardRouter);

  // Serve React frontend static files
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA fallback — serve index.html for any non-API route
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  // Global error handler
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`\n🚀 NetCompare backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Env:    ${process.env.NODE_ENV || 'development'}\n`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
