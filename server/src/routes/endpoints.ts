import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { getAllEndpoints, createEndpoint, getEndpointByParticipantId } from '../controllers/endpointsController';

const router = Router();

const VALID_MEDIUMS = ['fiber', 'mobile', 'fixed_wireless', 'other'];
const VALID_CONNECTIONS = ['wifi', 'ethernet', 'cellular', 'unknown'];

// GET /api/endpoints
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeDemo = req.query.demo === 'true';
    const endpoints = await getAllEndpoints(includeDemo);
    res.json({ data: endpoints, count: endpoints.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve endpoints' });
  }
});

// POST /api/endpoints
router.post(
  '/',
  [
    body('participant_id')
      .trim()
      .notEmpty().withMessage('Participant ID is required')
      .matches(/^[A-Za-z0-9_-]{1,20}$/).withMessage('Participant ID must be 1-20 alphanumeric characters, underscores, or hyphens'),
    body('site_label').trim().notEmpty().withMessage('Site label is required').isLength({ max: 100 }),
    body('access_medium').isIn(VALID_MEDIUMS).withMessage(`Access medium must be one of: ${VALID_MEDIUMS.join(', ')}`),
    body('isp').trim().notEmpty().withMessage('ISP is required').isLength({ max: 100 }),
    body('device_connection').isIn(VALID_CONNECTIONS).withMessage(`Device connection must be one of: ${VALID_CONNECTIONS.join(', ')}`),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const existing = await getEndpointByParticipantId(req.body.participant_id);
      if (existing) {
        return res.status(409).json({ error: `Participant ID '${req.body.participant_id}' is already registered` });
      }

      const endpoint = await createEndpoint({
        participant_id: req.body.participant_id,
        site_label: req.body.site_label,
        access_medium: req.body.access_medium,
        isp: req.body.isp,
        device_connection: req.body.device_connection,
        notes: req.body.notes,
      });

      return res.status(201).json({ data: endpoint, message: 'Endpoint registered successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
