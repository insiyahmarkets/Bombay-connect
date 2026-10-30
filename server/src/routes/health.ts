import { Router } from 'express';
import { queryOne } from '../db/database';
import os from 'os';

const router = Router();

router.get('/', async (_req, res) => {
  let dbStatus = 'ok';
  try {
    await queryOne<{ v: number }>('SELECT 1 as v');
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    service: 'NetCompare API',
    version: '1.0.0',
    db: dbStatus,
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
  });
});

export default router;
