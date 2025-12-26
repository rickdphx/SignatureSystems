import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import * as bookingService from '../services/booking.service';
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
 * POST /bookings/create
 * Create a new booking
 */
router.post(
  '/create',
  [
    body('location_id').notEmpty().withMessage('location_id is required'),
    body('service_variation_id')
      .notEmpty()
      .withMessage('service_variation_id is required'),
    body('service_variation_version')
      .isInt()
      .withMessage('service_variation_version must be an integer'),
    body('start_at')
      .isISO8601()
      .withMessage('start_at must be a valid ISO date'),
    body('source')
      .optional()
      .isIn(['phone', 'web', 'manual'])
      .withMessage('source must be one of: phone, web, manual'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await bookingService.createBooking({
        customerId: req.body.customer_id,
        customerInfo: req.body.customer_info,
        locationId: req.body.location_id,
        teamMemberId: req.body.team_member_id,
        barberSlug: req.body.barber_slug,
        serviceVariationId: req.body.service_variation_id,
        serviceVariationVersion: req.body.service_variation_version,
        startAt: req.body.start_at,
        note: req.body.note,
        source: req.body.source,
      });

      res.status(201).json({
        success: true,
        booking,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /bookings/list
 * List bookings with filters
 */
router.get(
  '/list',
  [
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await bookingService.listBookings({
        dateFrom: req.query.date_from as string | undefined,
        dateTo: req.query.date_to as string | undefined,
        locationId: req.query.location_id as string | undefined,
        teamMemberId: req.query.team_member_id as string | undefined,
        barberSlug: req.query.barber_slug as string | undefined,
        customerId: req.query.customer_id as string | undefined,
      });

      res.json({
        success: true,
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /bookings/:id
 * Get booking by ID
 */
router.get(
  '/:id',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await bookingService.getBookingById(req.params.id);

      res.json({
        success: true,
        booking,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /bookings/:id/cancel
 * Cancel a booking
 */
router.post(
  '/:id/cancel',
  [param('id').isUUID()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await bookingService.cancelBooking(req.params.id);

      res.json({
        success: true,
        booking,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
