import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import * as voiceService from '../services/voice.service';
import { ValidationError } from '../utils/errors';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(
      errors
        .array()
        .map((e) => e.msg)
        .join(', ')
    );
  }
  next();
};

/**
 * POST /voice/intake
 * Handle voice call intake and create booking
 * Supports multi-barber with auto-assignment
 */
router.post(
  '/intake',
  [
    body('customer_name').notEmpty().withMessage('customer_name is required'),
    body('customer_phone').notEmpty().withMessage('customer_phone is required'),
    body('service_variation_id')
      .notEmpty()
      .withMessage('service_variation_id is required'),
    body('requested_date_time')
      .isISO8601()
      .withMessage('requested_date_time must be a valid ISO date'),
    body('barber_slug').optional().isString(),
    body('team_member_id').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await voiceService.handleVoiceIntake({
        callSid: req.body.call_sid,
        customerName: req.body.customer_name,
        customerPhone: req.body.customer_phone,
        serviceVariationId: req.body.service_variation_id,
        requestedDateTime: req.body.requested_date_time,
        barberSlug: req.body.barber_slug,
        teamMemberId: req.body.team_member_id,
        note: req.body.note,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /voice/logs
 * Get call logs
 */
router.get(
  '/logs',
  [
    query('customer_phone').optional().isString(),
    query('status').optional().isString(),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await voiceService.getCallLogs({
        customerPhone: req.query.customer_phone as string | undefined,
        status: req.query.status as string | undefined,
        dateFrom: req.query.date_from as string | undefined,
        dateTo: req.query.date_to as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      res.json({
        success: true,
        count: logs.length,
        logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
