import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { getMeasurements, getMeasurementCount, createMeasurement, MeasurementFilters } from '../controllers/measurementsController';
import { getEndpointById } from '../controllers/endpointsController';

const router = Router();

const VALID_STATUSES = ['ok', 'failed', 'partial', 'incomplete'];

// GET /api/measurements
router.get(
  '/',
  [
    query('medium').optional().trim(),
    query('isp').optional().trim(),
    query('site').optional().trim(),
    query('device_connection').optional().trim(),
    query('date_from').optional().isISO8601().withMessage('date_from must be ISO8601'),
    query('date_to').optional().isISO8601().withMessage('date_to must be ISO8601'),
    query('demo').optional().isIn(['true', 'false']),
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const filters: MeasurementFilters = {
        medium: req.query.medium as string | undefined,
        isp: req.query.isp as string | undefined,
        site: req.query.site as string | undefined,
        device_connection: req.query.device_connection as string | undefined,
        date_from: req.query.date_from as string | undefined,
        date_to: req.query.date_to as string | undefined,
        is_demo: req.query.demo === 'true' ? true : req.query.demo === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const [measurements, total] = await Promise.all([
        getMeasurements(filters),
        getMeasurementCount(filters),
      ]);

      return res.json({ data: measurements, count: measurements.length, total });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve measurements' });
    }
  }
);

// POST /api/measurements
router.post(
  '/',
  [
    body('endpoint_id').isInt({ min: 1 }).withMessage('endpoint_id must be a positive integer'),
    body('measured_at').isISO8601().withMessage('measured_at must be an ISO8601 timestamp'),
    body('latency_ms').optional({ nullable: true }).isFloat({ min: 0, max: 100000 }),
    body('packet_loss_percent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('dns_response_ms').optional({ nullable: true }).isFloat({ min: 0, max: 100000 }),
    body('throughput_mbps').optional({ nullable: true }).isFloat({ min: 0 }),
    body('measurement_status').optional().isIn(VALID_STATUSES),
    body('failure_reason').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('measurement_method').optional({ nullable: true }).trim().isLength({ max: 200 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const endpoint = await getEndpointById(parseInt(req.body.endpoint_id));
      if (!endpoint) {
        return res.status(404).json({ error: `Endpoint ID ${req.body.endpoint_id} not found` });
      }

      const status = req.body.measurement_status || 'ok';
      if (status === 'ok') {
        const hasMetric = req.body.latency_ms != null || req.body.packet_loss_percent != null ||
          req.body.dns_response_ms != null || req.body.throughput_mbps != null;
        if (!hasMetric) {
          return res.status(400).json({ error: 'A successful measurement (status=ok) must include at least one metric value' });
        }
      }

      const measurement = await createMeasurement({
        endpoint_id: parseInt(req.body.endpoint_id),
        measured_at: req.body.measured_at,
        latency_ms: req.body.latency_ms ?? null,
        packet_loss_percent: req.body.packet_loss_percent ?? null,
        dns_response_ms: req.body.dns_response_ms ?? null,
        throughput_mbps: req.body.throughput_mbps ?? null,
        measurement_status: status,
        failure_reason: req.body.failure_reason ?? null,
        measurement_method: req.body.measurement_method ?? null,
      });

      return res.status(201).json({ data: measurement, message: 'Measurement recorded successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
