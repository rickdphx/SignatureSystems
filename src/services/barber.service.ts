import { PrismaClient, Barber } from '@prisma/client';
import { getTeamMembers } from '../clients/square';
import { generateSlug } from '../utils/helpers';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface BarberUpdateData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[];
  slug?: string;
  isActive?: boolean;
}

/**
 * Sync barbers from Square team members
 * Creates new Barber records for team members that don't exist
 * Does NOT overwrite custom fields for existing barbers
 */
export async function syncBarbersFromSquare(): Promise<Barber[]> {
  logger.info('Starting barber sync from Square');

  try {
    const teamMembers = await getTeamMembers();
    logger.info(`Found ${teamMembers.length} team members in Square`);

    const barbers: Barber[] = [];

    for (const member of teamMembers) {
      if (!member.id) continue;

      const squareTeamMemberId = member.id;
      const displayName =
        member.givenName && member.familyName
          ? `${member.givenName} ${member.familyName}`
          : member.givenName || member.familyName || 'Unknown';

      // Check if barber already exists
      let barber = await prisma.barber.findUnique({
        where: { squareTeamMemberId },
      });

      if (barber) {
        logger.info(`Barber already exists for team member ${squareTeamMemberId}`, {
          barberId: barber.id,
          displayName: barber.displayName,
        });
        barbers.push(barber);
        continue;
      }

      // Generate unique slug
      let slug = generateSlug(displayName);
      let slugSuffix = 1;

      while (await prisma.barber.findUnique({ where: { slug } })) {
        slug = `${generateSlug(displayName)}-${slugSuffix}`;
        slugSuffix++;
      }

      // Create new barber
      barber = await prisma.barber.create({
        data: {
          squareTeamMemberId,
          slug,
          displayName,
          isActive: true,
        },
      });

      logger.info(`Created new barber for team member ${squareTeamMemberId}`, {
        barberId: barber.id,
        displayName: barber.displayName,
        slug: barber.slug,
      });

      barbers.push(barber);
    }

    logger.info(`Barber sync completed. Total barbers: ${barbers.length}`);
    return barbers;
  } catch (error) {
    logger.error('Failed to sync barbers from Square', { error });
    throw error;
  }
}

/**
 * Get all active barbers
 */
export async function getActiveBarbers(): Promise<Barber[]> {
  return prisma.barber.findMany({
    where: { isActive: true },
    orderBy: { displayName: 'asc' },
  });
}

/**
 * Get all barbers (including inactive)
 */
export async function getAllBarbers(): Promise<Barber[]> {
  return prisma.barber.findMany({
    orderBy: { displayName: 'asc' },
  });
}

/**
 * Get barber by ID
 */
export async function getBarberById(id: string): Promise<Barber> {
  const barber = await prisma.barber.findUnique({
    where: { id },
  });

  if (!barber) {
    throw new NotFoundError(`Barber with ID ${id} not found`);
  }

  return barber;
}

/**
 * Get barber by slug
 */
export async function getBarberBySlug(slug: string): Promise<Barber> {
  const barber = await prisma.barber.findUnique({
    where: { slug },
  });

  if (!barber) {
    throw new NotFoundError(`Barber with slug ${slug} not found`);
  }

  return barber;
}

/**
 * Get barber by Square team member ID
 */
export async function getBarberByTeamMemberId(
  teamMemberId: string
): Promise<Barber> {
  const barber = await prisma.barber.findUnique({
    where: { squareTeamMemberId: teamMemberId },
  });

  if (!barber) {
    throw new NotFoundError(
      `Barber with team member ID ${teamMemberId} not found`
    );
  }

  return barber;
}

/**
 * Update barber
 */
export async function updateBarber(
  id: string,
  data: BarberUpdateData
): Promise<Barber> {
  // Validate barber exists
  await getBarberById(id);

  // If updating slug, check for uniqueness
  if (data.slug) {
    const existingBarber = await prisma.barber.findUnique({
      where: { slug: data.slug },
    });

    if (existingBarber && existingBarber.id !== id) {
      throw new ConflictError(`Slug ${data.slug} is already taken`);
    }
  }

  // Validate display name if provided
  if (data.displayName && data.displayName.trim().length === 0) {
    throw new ValidationError('Display name cannot be empty');
  }

  const barber = await prisma.barber.update({
    where: { id },
    data,
  });

  logger.info(`Updated barber ${id}`, { updates: data });

  return barber;
}

/**
 * Delete barber (soft delete by setting isActive to false)
 */
export async function deactivateBarber(id: string): Promise<Barber> {
  return updateBarber(id, { isActive: false });
}

/**
 * Activate barber
 */
export async function activateBarber(id: string): Promise<Barber> {
  return updateBarber(id, { isActive: true });
}
