import { retrieveBookings } from '../clients/square';
import { getBarberBySlug, getBarberByTeamMemberId } from './barber.service';
import { getServiceVariationById } from './catalog.service';
import { ValidationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import {
  addMinutes,
  parseISO,
  startOfDay,
  endOfDay,
  format,
  areIntervalsOverlapping,
  isWithinInterval,
} from 'date-fns';

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
  duration: number;
}

export interface AvailabilityParams {
  locationId: string;
  teamMemberId?: string;
  barberSlug?: string;
  serviceVariationId: string;
  dateFrom: string;
  dateTo: string;
}

// Business hours (customize as needed)
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 18, // 6 PM
};

const SLOT_INTERVAL = 15; // Check availability every 15 minutes

/**
 * Check availability for a barber
 */
export async function checkAvailability(
  params: AvailabilityParams
): Promise<AvailabilitySlot[]> {
  logger.info('Checking availability', params);

  // Resolve barber
  let teamMemberId = params.teamMemberId;

  if (params.barberSlug) {
    const barber = await getBarberBySlug(params.barberSlug);
    teamMemberId = barber.squareTeamMemberId;
  }

  if (!teamMemberId) {
    throw new ValidationError('Either teamMemberId or barberSlug must be provided');
  }

  // Get service details
  const service = await getServiceVariationById(params.serviceVariationId);
  if (!service) {
    throw new NotFoundError(
      `Service variation ${params.serviceVariationId} not found`
    );
  }

  const serviceDuration = service.duration;

  // Parse date range
  const startDate = parseISO(params.dateFrom);
  const endDate = parseISO(params.dateTo);

  // Fetch existing bookings for this team member
  const existingBookings = await retrieveBookings({
    locationId: params.locationId,
    startAtMin: params.dateFrom,
    startAtMax: params.dateTo,
    teamMemberIds: [teamMemberId],
  });

  // Convert bookings to time slots
  const bookedSlots: { start: Date; end: Date }[] = [];

  for (const booking of existingBookings) {
    if (!booking.startAt) continue;

    const bookingStart = parseISO(booking.startAt);
    let bookingDuration = serviceDuration;

    // Calculate booking duration from segments
    if (booking.appointmentSegments && booking.appointmentSegments.length > 0) {
      bookingDuration = booking.appointmentSegments.reduce(
        (total, segment) => total + (segment.durationMinutes || 0),
        0
      );
    }

    const bookingEnd = addMinutes(bookingStart, bookingDuration);

    bookedSlots.push({
      start: bookingStart,
      end: bookingEnd,
    });
  }

  // Generate available slots
  const availableSlots: AvailabilitySlot[] = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(BUSINESS_HOURS.start, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(BUSINESS_HOURS.end, 0, 0, 0);

    let slotStart = dayStart;

    while (slotStart < dayEnd) {
      const slotEnd = addMinutes(slotStart, serviceDuration);

      // Check if slot is within business hours
      if (slotEnd > dayEnd) {
        break;
      }

      // Check if slot overlaps with any booked slots
      const isBooked = bookedSlots.some((booked) =>
        areIntervalsOverlapping(
          { start: slotStart, end: slotEnd },
          { start: booked.start, end: booked.end },
          { inclusive: false }
        )
      );

      if (!isBooked) {
        availableSlots.push({
          startAt: slotStart.toISOString(),
          endAt: slotEnd.toISOString(),
          duration: serviceDuration,
        });
      }

      // Move to next slot
      slotStart = addMinutes(slotStart, SLOT_INTERVAL);
    }

    // Move to next day
    currentDate = addMinutes(currentDate, 24 * 60);
    currentDate = startOfDay(currentDate);
  }

  logger.info(`Found ${availableSlots.length} available slots for barber`, {
    teamMemberId,
    serviceVariationId: params.serviceVariationId,
  });

  return availableSlots;
}

/**
 * Check if a specific time slot is available
 */
export async function isSlotAvailable(
  locationId: string,
  teamMemberId: string,
  serviceVariationId: string,
  startAt: string
): Promise<boolean> {
  // Get service duration
  const service = await getServiceVariationById(serviceVariationId);
  if (!service) {
    throw new NotFoundError(
      `Service variation ${serviceVariationId} not found`
    );
  }

  const slotStart = parseISO(startAt);
  const slotEnd = addMinutes(slotStart, service.duration);

  // Check existing bookings
  const existingBookings = await retrieveBookings({
    locationId,
    startAtMin: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"),
    startAtMax: format(slotEnd, "yyyy-MM-dd'T'HH:mm:ss"),
    teamMemberIds: [teamMemberId],
  });

  // Check for overlaps
  for (const booking of existingBookings) {
    if (!booking.startAt) continue;

    const bookingStart = parseISO(booking.startAt);
    let bookingDuration = service.duration;

    if (booking.appointmentSegments && booking.appointmentSegments.length > 0) {
      bookingDuration = booking.appointmentSegments.reduce(
        (total, segment) => total + (segment.durationMinutes || 0),
        0
      );
    }

    const bookingEnd = addMinutes(bookingStart, bookingDuration);

    const overlaps = areIntervalsOverlapping(
      { start: slotStart, end: slotEnd },
      { start: bookingStart, end: bookingEnd },
      { inclusive: false }
    );

    if (overlaps) {
      return false;
    }
  }

  return true;
}
