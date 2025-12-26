import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import * as barberService from '../services/barber.service';
import * as barberServiceService from '../services/barberService.service';
import * as catalogService from '../services/catalog.service';
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
 * POST /barbers/sync-from-square
 * Sync barbers from Square team members
 */
router.post('/sync-from-square', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const barbers = await barberService.syncBarbersFromSquare();
    res.json({
      success: true,
      count: barbers.length,
      barbers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /barbers
 * Get all barbers (optionally filter by active status)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active === 'true';
    const barbers = activeOnly
      ? await barberService.getActiveBarbers()
      : await barberService.getAllBarbers();

    res.json({
      success: true,
      count: barbers.length,
      barbers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /barbers/:slug
 * Get barber by slug with services
 */
router.get(
  '/:slug',
  [param('slug').isString().notEmpty()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barber = await barberService.getBarberBySlug(req.params.slug);
      const services = await catalogService.getBarberServiceVariations(barber.id);

      res.json({
        success: true,
        barber: {
          ...barber,
          services,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /barbers/:id
 * Update barber profile
 */
router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('displayName').optional().isString(),
    body('bio').optional().isString(),
    body('avatarUrl').optional().isURL(),
    body('specialties').optional().isArray(),
    body('slug').optional().isString(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barber = await barberService.updateBarber(req.params.id, req.body);

      res.json({
        success: true,
        barber,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /barbers/:slug/services
 * Get services offered by a barber
 */
router.get(
  '/:slug/services',
  [param('slug').isString().notEmpty()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barber = await barberService.getBarberBySlug(req.params.slug);
      const services = await catalogService.getBarberServiceVariations(barber.id);

      res.json({
        success: true,
        count: services.length,
        services,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /barbers/:id/services
 * Assign services to a barber
 */
router.post(
  '/:id/services',
  [param('id').isUUID(), body('serviceVariationIds').isArray()],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const barberServices = await barberServiceService.assignServicesToBarber(
        req.params.id,
        req.body.serviceVariationIds
      );

      res.json({
        success: true,
        count: barberServices.length,
        services: barberServices,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
