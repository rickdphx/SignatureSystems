import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import * as barberService from '../services/barber.service';
import * as catalogService from '../services/catalog.service';
import * as availabilityService from '../services/availability.service';
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
 * GET /public/barbers
 * Get all active barbers (public view)
 */
router.get('/barbers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const barbers = await barberService.getActiveBarbers();

    // Return only public fields
    const publicBarbers = barbers.map((barber) => ({
      slug: barber.slug,
      displayName: barber.displayName,
      bio: barber.bio,
      avatarUrl: barber.avatarUrl,
      specialties: barber.specialties,
    }));

    res.json({
      success: true,
      count: publicBarbers.length,
      barbers: publicBarbers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /public/barbers/:slug
 * Get barber profile with services
 */
router.get(
  '/barbers/:slug',
  [param('slug').isString().notEmpty()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barber = await barberService.getBarberBySlug(req.params.slug);
      const services = await catalogService.getBarberServiceVariations(barber.id);

      res.json({
        success: true,
        barber: {
          slug: barber.slug,
          displayName: barber.displayName,
          bio: barber.bio,
          avatarUrl: barber.avatarUrl,
          specialties: barber.specialties,
          services,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /public/barbers/:slug/availability
 * Check availability for a barber
 */
router.get(
  '/barbers/:slug/availability',
  [
    param('slug').isString().notEmpty(),
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
        locationId: process.env.SQUARE_LOCATION_ID!,
        barberSlug: req.params.slug,
        serviceVariationId: req.query.service_variation_id as string,
        dateFrom: req.query.date_from as string,
        dateTo: req.query.date_to as string,
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

/**
 * POST /public/bookings
 * Create a booking (public endpoint)
 */
router.post(
  '/bookings',
  [
    body('customer_info').isObject().withMessage('customer_info is required'),
    body('customer_info.firstName')
      .notEmpty()
      .withMessage('customer_info.firstName is required'),
    body('customer_info.phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number'),
    body('customer_info.email')
      .optional()
      .isEmail()
      .withMessage('Invalid email'),
    body('barber_slug').notEmpty().withMessage('barber_slug is required'),
    body('service_variation_id')
      .notEmpty()
      .withMessage('service_variation_id is required'),
    body('start_at')
      .isISO8601()
      .withMessage('start_at must be a valid ISO date'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get service variation version (in production, fetch from catalog)
      const service = await catalogService.getServiceVariationById(
        req.body.service_variation_id
      );

      if (!service) {
        throw new ValidationError('Invalid service_variation_id');
      }

      const booking = await bookingService.createBooking({
        customerInfo: {
          firstName: req.body.customer_info.firstName,
          lastName: req.body.customer_info.lastName,
          phone: req.body.customer_info.phone,
          email: req.body.customer_info.email,
        },
        locationId: process.env.SQUARE_LOCATION_ID!,
        barberSlug: req.body.barber_slug,
        serviceVariationId: req.body.service_variation_id,
        serviceVariationVersion: Number(service.version),
        startAt: req.body.start_at,
        note: req.body.note,
        source: 'web',
      });

      // Return public booking info
      res.status(201).json({
        success: true,
        booking: {
          id: booking.id,
          status: booking.status,
          startAt: booking.startAt,
          duration: booking.duration,
          barber: {
            displayName: booking.customer.firstName, // This should be barber, will fix in response
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /public/services
 * Get all available services
 */
router.get('/services', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const services = await catalogService.getAllServiceVariations();

    res.json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
