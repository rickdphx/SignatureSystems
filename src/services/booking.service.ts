import { PrismaClient, Booking, Customer } from '@prisma/client';
import {
  createBooking as createSquareBooking,
  retrieveBookings,
  cancelBooking as cancelSquareBooking,
  upsertCustomer,
} from '../clients/square';
import { getBarberBySlug, getBarberById } from './barber.service';
import { getServiceVariationById } from './catalog.service';
import { isSlotAvailable } from './availability.service';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateBookingParams {
  customerId?: string;
  customerInfo?: {
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  locationId: string;
  teamMemberId?: string;
  barberSlug?: string;
  serviceVariationId: string;
  serviceVariationVersion: number;
  startAt: string;
  note?: string;
  source?: 'phone' | 'web' | 'manual';
}

export interface BookingWithRelations extends Booking {
  customer: Customer;
}

/**
 * Create a booking
 */
export async function createBooking(
  params: CreateBookingParams
): Promise<BookingWithRelations> {
  logger.info('Creating booking', params);

  // Resolve barber
  let barberId: string;
  let teamMemberId = params.teamMemberId;

  if (params.barberSlug) {
    const barber = await getBarberBySlug(params.barberSlug);
    barberId = barber.id;
    teamMemberId = barber.squareTeamMemberId;
  } else if (params.teamMemberId) {
    const barber = await prisma.barber.findUnique({
      where: { squareTeamMemberId: params.teamMemberId },
    });
    if (!barber) {
      throw new NotFoundError(
        `Barber with team member ID ${params.teamMemberId} not found`
      );
    }
    barberId = barber.id;
  } else {
    throw new ValidationError('Either teamMemberId or barberSlug must be provided');
  }

  // Get service details
  const service = await getServiceVariationById(params.serviceVariationId);
  if (!service) {
    throw new NotFoundError(
      `Service variation ${params.serviceVariationId} not found`
    );
  }

  // Check availability
  const isAvailable = await isSlotAvailable(
    params.locationId,
    teamMemberId!,
    params.serviceVariationId,
    params.startAt
  );

  if (!isAvailable) {
    throw new ConflictError('The requested time slot is not available');
  }

  // Handle customer
  let squareCustomerId = params.customerId;
  let customer: Customer;

  if (params.customerInfo) {
    // Upsert customer in Square
    const squareCustomer = await upsertCustomer(params.customerInfo);
    squareCustomerId = squareCustomer?.id;

    // Upsert customer in our database
    if (squareCustomerId) {
      customer = await prisma.customer.upsert({
        where: { squareCustomerId },
        update: {
          firstName: params.customerInfo.firstName,
          lastName: params.customerInfo.lastName,
          phone: params.customerInfo.phone,
          email: params.customerInfo.email,
        },
        create: {
          squareCustomerId,
          firstName: params.customerInfo.firstName,
          lastName: params.customerInfo.lastName,
          phone: params.customerInfo.phone,
          email: params.customerInfo.email,
        },
      });
    } else {
      // Create customer without Square ID (fallback)
      customer = await prisma.customer.create({
        data: {
          firstName: params.customerInfo.firstName,
          lastName: params.customerInfo.lastName,
          phone: params.customerInfo.phone,
          email: params.customerInfo.email,
        },
      });
    }
  } else if (params.customerId) {
    const existingCustomer = await prisma.customer.findUnique({
      where: { squareCustomerId: params.customerId },
    });

    if (!existingCustomer) {
      throw new NotFoundError(`Customer with ID ${params.customerId} not found`);
    }

    customer = existingCustomer;
    squareCustomerId = customer.squareCustomerId!;
  } else {
    throw new ValidationError('Either customerId or customerInfo must be provided');
  }

  // Create booking in Square
  const squareBooking = await createSquareBooking({
    customerId: squareCustomerId!,
    locationId: params.locationId,
    startAt: params.startAt,
    teamMemberId: teamMemberId!,
    serviceVariationId: params.serviceVariationId,
    serviceVariationVersion: BigInt(params.serviceVariationVersion),
    customerNote: params.note,
  });

  // Create booking in our database
  const booking = await prisma.booking.create({
    data: {
      squareBookingId: squareBooking?.id,
      customerId: customer.id,
      barberId,
      locationId: params.locationId,
      teamMemberId: teamMemberId!,
      serviceVariationId: params.serviceVariationId,
      serviceVariationVersion: params.serviceVariationVersion,
      startAt: params.startAt,
      duration: service.duration,
      status: squareBooking?.status || 'PENDING',
      source: params.source || 'web',
      customerNote: params.note,
      squareRequestPayload: {
        customerId: squareCustomerId,
        locationId: params.locationId,
        startAt: params.startAt,
        teamMemberId,
        serviceVariationId: params.serviceVariationId,
        serviceVariationVersion: params.serviceVariationVersion,
      },
      squareResponsePayload: squareBooking,
    },
    include: {
      customer: true,
    },
  });

  logger.info(`Created booking ${booking.id}`, {
    squareBookingId: squareBooking?.id,
    barberId,
    startAt: params.startAt,
  });

  return booking;
}

/**
 * List bookings with filters
 */
export async function listBookings(params: {
  dateFrom?: string;
  dateTo?: string;
  locationId?: string;
  teamMemberId?: string;
  barberSlug?: string;
  customerId?: string;
}): Promise<BookingWithRelations[]> {
  const where: any = {};

  if (params.dateFrom || params.dateTo) {
    where.startAt = {};
    if (params.dateFrom) where.startAt.gte = params.dateFrom;
    if (params.dateTo) where.startAt.lte = params.dateTo;
  }

  if (params.locationId) {
    where.locationId = params.locationId;
  }

  if (params.teamMemberId) {
    where.teamMemberId = params.teamMemberId;
  }

  if (params.barberSlug) {
    const barber = await getBarberBySlug(params.barberSlug);
    where.barberId = barber.id;
  }

  if (params.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { squareCustomerId: params.customerId },
    });

    if (customer) {
      where.customerId = customer.id;
    }
  }

  return prisma.booking.findMany({
    where,
    include: {
      customer: true,
    },
    orderBy: {
      startAt: 'asc',
    },
  });
}

/**
 * Get booking by ID
 */
export async function getBookingById(id: string): Promise<BookingWithRelations> {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
    },
  });

  if (!booking) {
    throw new NotFoundError(`Booking with ID ${id} not found`);
  }

  return booking;
}

/**
 * Cancel booking
 */
export async function cancelBooking(id: string): Promise<Booking> {
  const booking = await getBookingById(id);

  // Cancel in Square if it has a Square booking ID
  if (booking.squareBookingId) {
    try {
      await cancelSquareBooking(booking.squareBookingId);
    } catch (error) {
      logger.error(`Failed to cancel Square booking ${booking.squareBookingId}`, {
        error,
      });
      // Continue with local cancellation even if Square fails
    }
  }

  // Update status in our database
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: 'CANCELLED_BY_CUSTOMER',
    },
  });

  logger.info(`Cancelled booking ${id}`);

  return updatedBooking;
}

/**
 * Sync bookings from Square
 */
export async function syncBookingsFromSquare(
  locationId: string,
  startAtMin?: string,
  startAtMax?: string
): Promise<void> {
  logger.info('Syncing bookings from Square', {
    locationId,
    startAtMin,
    startAtMax,
  });

  const squareBookings = await retrieveBookings({
    locationId,
    startAtMin,
    startAtMax,
  });

  for (const squareBooking of squareBookings) {
    if (!squareBooking.id) continue;

    // Check if booking already exists
    const existing = await prisma.booking.findUnique({
      where: { squareBookingId: squareBooking.id },
    });

    if (existing) {
      // Update status if changed
      if (existing.status !== squareBooking.status) {
        await prisma.booking.update({
          where: { id: existing.id },
          data: { status: squareBooking.status || 'PENDING' },
        });
      }
      continue;
    }

    // Extract booking details
    const segment = squareBooking.appointmentSegments?.[0];
    if (!segment) continue;

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { squareCustomerId: squareBooking.customerId || undefined },
    });

    if (!customer && squareBooking.customerId) {
      customer = await prisma.customer.create({
        data: {
          squareCustomerId: squareBooking.customerId,
          firstName: 'Unknown',
        },
      });
    }

    if (!customer) continue;

    // Find barber
    const barber = await prisma.barber.findUnique({
      where: { squareTeamMemberId: segment.teamMemberId || undefined },
    });

    if (!barber) continue;

    // Create booking
    await prisma.booking.create({
      data: {
        squareBookingId: squareBooking.id,
        customerId: customer.id,
        barberId: barber.id,
        locationId: squareBooking.locationId || locationId,
        teamMemberId: segment.teamMemberId!,
        serviceVariationId: segment.serviceVariationId!,
        serviceVariationVersion: Number(segment.serviceVariationVersion || 0),
        startAt: squareBooking.startAt!,
        duration: segment.durationMinutes || 30,
        status: squareBooking.status || 'PENDING',
        source: 'manual',
        squareResponsePayload: squareBooking,
      },
    });
  }

  logger.info(`Synced ${squareBookings.length} bookings from Square`);
}
