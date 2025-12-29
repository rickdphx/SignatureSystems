import { PrismaClient, BarberService } from '@prisma/client';
import { getBarberById } from './barber.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get all services assigned to a barber
 */
export async function getBarberServices(
  barberId: string
): Promise<BarberService[]> {
  // Validate barber exists
  await getBarberById(barberId);

  return prisma.barberService.findMany({
    where: {
      barberId,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get services by barber slug
 */
export async function getBarberServicesBySlug(
  slug: string
): Promise<BarberService[]> {
  const barber = await prisma.barber.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!barber) {
    throw new NotFoundError(`Barber with slug ${slug} not found`);
  }

  return barber.services;
}

/**
 * Check if a barber offers a specific service
 */
export async function barberOffersService(
  barberId: string,
  serviceVariationId: string
): Promise<boolean> {
  const service = await prisma.barberService.findFirst({
    where: {
      barberId,
      serviceVariationId,
      isActive: true,
    },
  });

  return service !== null;
}

/**
 * Assign services to a barber
 * This will replace all existing service assignments
 */
export async function assignServicesToBarber(
  barberId: string,
  serviceVariationIds: string[]
): Promise<BarberService[]> {
  // Validate barber exists
  await getBarberById(barberId);

  // Validate input
  if (!Array.isArray(serviceVariationIds)) {
    throw new ValidationError('serviceVariationIds must be an array');
  }

  logger.info(`Assigning ${serviceVariationIds.length} services to barber ${barberId}`);

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Deactivate all existing services for this barber
    await tx.barberService.updateMany({
      where: { barberId },
      data: { isActive: false },
    });

    // Create or reactivate service assignments
    const barberServices: BarberService[] = [];

    for (const serviceVariationId of serviceVariationIds) {
      // Check if assignment already exists
      const existing = await tx.barberService.findFirst({
        where: {
          barberId,
          serviceVariationId,
        },
      });

      if (existing) {
        // Reactivate existing assignment
        const updated = await tx.barberService.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        barberServices.push(updated);
      } else {
        // Create new assignment
        const created = await tx.barberService.create({
          data: {
            barberId,
            serviceVariationId,
            isActive: true,
          },
        });
        barberServices.push(created);
      }
    }

    return barberServices;
  });

  logger.info(`Successfully assigned services to barber ${barberId}`, {
    count: result.length,
  });

  return result;
}

/**
 * Add a single service to a barber
 */
export async function addServiceToBarber(
  barberId: string,
  serviceVariationId: string
): Promise<BarberService> {
  // Validate barber exists
  await getBarberById(barberId);

  // Check if assignment already exists
  const existing = await prisma.barberService.findFirst({
    where: {
      barberId,
      serviceVariationId,
    },
  });

  if (existing) {
    if (existing.isActive) {
      return existing;
    }

    // Reactivate
    return prisma.barberService.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
  }

  // Create new assignment
  const barberService = await prisma.barberService.create({
    data: {
      barberId,
      serviceVariationId,
      isActive: true,
    },
  });

  logger.info(`Added service ${serviceVariationId} to barber ${barberId}`);

  return barberService;
}

/**
 * Remove a service from a barber (soft delete)
 */
export async function removeServiceFromBarber(
  barberId: string,
  serviceVariationId: string
): Promise<void> {
  await prisma.barberService.updateMany({
    where: {
      barberId,
      serviceVariationId,
    },
    data: { isActive: false },
  });

  logger.info(`Removed service ${serviceVariationId} from barber ${barberId}`);
}

/**
 * Get all barbers that offer a specific service
 */
export async function getBarbersOfferingService(
  serviceVariationId: string
): Promise<string[]> {
  const barberServices = await prisma.barberService.findMany({
    where: {
      serviceVariationId,
      isActive: true,
    },
    include: {
      barber: {
        where: { isActive: true },
      },
    },
  });

  return barberServices
    .filter((bs) => bs.barber !== null)
    .map((bs) => bs.barberId);
}
