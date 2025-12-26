import { Router, Request, Response, NextFunction } from 'express';
import * as catalogService from '../services/catalog.service';

const router = Router();

/**
 * GET /services
 * Get all service variations from Square catalog
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
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
