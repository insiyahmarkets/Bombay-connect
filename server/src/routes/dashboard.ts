import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { getDashboardSummary, getDashboardTrends, getDashboardComparison } from '../controllers/dashboardController';
import { MeasurementFilters } from '../controllers/measurementsController';

const router = Router();

function parseFilters(req: Request): MeasurementFilters {
  return {
    medium: req.query.medium as string | undefined,
    isp: req.query.isp as string | undefined,
    site: req.query.site as string | undefined,
    device_connection: req.query.device_connection as string | undefined,
    date_from: req.query.date_from as string | undefined,
    date_to: req.query.date_to as string | undefined,
    is_demo: req.query.demo === 'true' ? true : req.query.demo === 'false' ? false : undefined,
  };
}

const commonValidators = [
  query('medium').optional().trim(),
  query('isp').optional().trim(),
  query('site').optional().trim(),
  query('device_connection').optional().trim(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('demo').optional().isIn(['true', 'false']),
];

router.get('/summary', commonValidators, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid query params', details: errors.array() });
  try {
    const summary = await getDashboardSummary(parseFilters(req));
    res.json({ data: summary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

router.get('/trends', commonValidators, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid query params', details: errors.array() });
  try {
    const trends = await getDashboardTrends(parseFilters(req));
    res.json({ data: trends });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute trends' });
  }
});

router.get('/comparison', commonValidators, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid query params', details: errors.array() });
  try {
    const comparison = await getDashboardComparison(parseFilters(req));
    res.json({ data: comparison });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute comparison' });
  }
});

export default router;
