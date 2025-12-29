import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import * as availabilityService from '../services/availability.service';
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
 * GET /availability
 * Check availability for a barber and service
 * Query params:
 *  - location_id (required)
 *  - service_variation_id (required)
 *  - date_from (required, ISO format)
 *  - date_to (required, ISO format)
 *  - team_member_id (optional)
 *  - barber_slug (optional)
 */
router.get(
  '/',
  [
    query('location_id').notEmpty().withMessage('location_id is required'),
    query('service_variation_id')
      .notEmpty()
      .withMessage('service_variation_id is required'),
    query('date_from')
      .notEmpty()
      .isISO8601()
      .withMessage('date_from must be a valid ISO date'),
    query('date_to')
      .notEmpty()
      .isISO8601()
      .withMessage('date_to must be a valid ISO date'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slots = await availabilityService.checkAvailability({
        locationId: req.query.location_id as string,
        serviceVariationId: req.query.service_variation_id as string,
        dateFrom: req.query.date_from as string,
        dateTo: req.query.date_to as string,
        teamMemberId: req.query.team_member_id as string | undefined,
        barberSlug: req.query.barber_slug as string | undefined,
      });

      res.json({
        success: true,
        count: slots.length,
        slots,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
