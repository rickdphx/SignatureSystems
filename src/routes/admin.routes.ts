import { Router, Request, Response, NextFunction } from 'express';
import { getTeamMembers, locationsApi } from '../clients/square';
import { getAllBarbers } from '../services/barber.service';
import { getAllServiceVariations, getServicesByCategory } from '../services/catalog.service';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /admin/square/summary
 * Get comprehensive Square configuration summary
 */
router.get('/square/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Fetching Square configuration summary');

    // Fetch location details
    const locationId = process.env.SQUARE_LOCATION_ID!;
    let locationInfo = null;

    try {
      const locationResponse = await locationsApi.retrieveLocation(locationId);
      const location = locationResponse.result.location;

      if (location) {
        locationInfo = {
          id: location.id,
          name: location.name,
          address: location.address
            ? {
                addressLine1: location.address.addressLine1,
                locality: location.address.locality,
                administrativeDistrictLevel1:
                  location.address.administrativeDistrictLevel1,
                postalCode: location.address.postalCode,
              }
            : null,
          phoneNumber: location.phoneNumber,
          businessEmail: location.businessEmail,
          timezone: location.timezone,
          status: location.status,
        };
      }
    } catch (error) {
      logger.error('Failed to fetch location details', { error });
    }

    // Fetch team members
    const teamMembers = await getTeamMembers();
    const barbers = await getAllBarbers();

    const teamMemberSummary = teamMembers.map((tm) => {
      const matchingBarber = barbers.find(
        (b) => b.squareTeamMemberId === tm.id
      );

      return {
        id: tm.id,
        givenName: tm.givenName,
        familyName: tm.familyName,
        emailAddress: tm.emailAddress,
        phoneNumber: tm.phoneNumber,
        status: tm.status,
        mappedToBarber: !!matchingBarber,
        barberInfo: matchingBarber
          ? {
              id: matchingBarber.id,
              slug: matchingBarber.slug,
              displayName: matchingBarber.displayName,
              isActive: matchingBarber.isActive,
            }
          : null,
      };
    });

    // Fetch services
    const servicesByCategory = await getServicesByCategory();
    const allServices = await getAllServiceVariations();

    const serviceSummary = {
      totalServices: allServices.length,
      categories: Object.keys(servicesByCategory).map((categoryName) => ({
        name: categoryName,
        serviceCount: servicesByCategory[categoryName].length,
        services: servicesByCategory[categoryName].map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: s.price,
          version: Number(s.version),
        })),
      })),
    };

    res.json({
      success: true,
      summary: {
        location: locationInfo,
        teamMembers: {
          total: teamMembers.length,
          mappedToBarbers: teamMemberSummary.filter((tm) => tm.mappedToBarber)
            .length,
          members: teamMemberSummary,
        },
        services: serviceSummary,
        configuration: {
          environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
          domain: process.env.DOMAIN || 'thesignaturechair.com',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
