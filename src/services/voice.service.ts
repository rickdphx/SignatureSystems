import { PrismaClient } from '@prisma/client';
import { createBooking } from './booking.service';
import { getActiveBarbers, getBarberBySlug } from './barber.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface VoiceIntakeParams {
  callSid?: string;
  customerName: string;
  customerPhone: string;
  serviceVariationId: string;
  requestedDateTime: string;
  barberSlug?: string;
  teamMemberId?: string;
  note?: string;
}

/**
 * Handle voice intake and create booking
 * Supports multi-barber with auto-assignment if no barber specified
 */
export async function handleVoiceIntake(params: VoiceIntakeParams) {
  logger.info('Processing voice intake', params);

  // Create call log
  const callLog = await prisma.callLog.create({
    data: {
      callSid: params.callSid,
      customerPhone: params.customerPhone,
      customerName: params.customerName,
      barberSlug: params.barberSlug,
      teamMemberId: params.teamMemberId,
      serviceRequested: params.serviceVariationId,
      requestedDateTime: params.requestedDateTime,
      status: 'initiated',
    },
  });

  try {
    // Determine barber
    let barberSlug = params.barberSlug;
    let teamMemberId = params.teamMemberId;

    // If no barber specified, auto-assign
    if (!barberSlug && !teamMemberId) {
      const assignedBarber = await autoAssignBarber();
      if (assignedBarber) {
        barberSlug = assignedBarber.slug;
        teamMemberId = assignedBarber.squareTeamMemberId;

        logger.info(`Auto-assigned barber ${assignedBarber.displayName}`, {
          barberId: assignedBarber.id,
          slug: assignedBarber.slug,
        });
      }
    }

    // Resolve service variation version (simplified - in production you'd fetch from catalog)
    const serviceVariationVersion = 1;

    // Create booking
    const booking = await createBooking({
      customerInfo: {
        firstName: params.customerName,
        phone: params.customerPhone,
      },
      locationId: process.env.SQUARE_LOCATION_ID!,
      barberSlug,
      teamMemberId,
      serviceVariationId: params.serviceVariationId,
      serviceVariationVersion,
      startAt: params.requestedDateTime,
      note: params.note,
      source: 'phone',
    });

    // Update call log
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: {
        status: 'completed',
        metadata: {
          bookingId: booking.id,
          squareBookingId: booking.squareBookingId,
        },
      },
    });

    logger.info(`Voice intake completed successfully`, {
      callLogId: callLog.id,
      bookingId: booking.id,
    });

    return {
      success: true,
      booking,
      callLog,
    };
  } catch (error) {
    // Update call log with error
    await prisma.callLog.update({
      where: { id: callLog.id },
      data: {
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });

    logger.error('Voice intake failed', {
      callLogId: callLog.id,
      error,
    });

    throw error;
  }
}

/**
 * Auto-assign a barber (pick first available or random)
 * Strategy: Pick first active barber (can be enhanced with load balancing)
 */
async function autoAssignBarber() {
  const activeBarbers = await getActiveBarbers();

  if (activeBarbers.length === 0) {
    logger.warn('No active barbers available for auto-assignment');
    return null;
  }

  // Strategy 1: Return first active barber
  // You could enhance this with:
  // - Random selection
  // - Load balancing (barber with fewest bookings)
  // - Round-robin
  // - Skill-based routing

  return activeBarbers[0];
}

/**
 * Get call logs with filters
 */
export async function getCallLogs(params: {
  customerPhone?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const where: any = {};

  if (params.customerPhone) {
    where.customerPhone = params.customerPhone;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = params.dateFrom;
    if (params.dateTo) where.createdAt.lte = params.dateTo;
  }

  return prisma.callLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: params.limit || 100,
  });
}
