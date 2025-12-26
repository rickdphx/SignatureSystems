import { Client, Environment, ApiError } from 'square';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { SquareApiError } from '../utils/errors';

const prisma = new PrismaClient();

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? Environment.Production
      : Environment.Sandbox,
});

export const bookingsApi = squareClient.bookingsApi;
export const catalogApi = squareClient.catalogApi;
export const customersApi = squareClient.customersApi;
export const teamApi = squareClient.teamApi;
export const locationsApi = squareClient.locationsApi;

/**
 * Log Square API request and response
 */
async function logSquareApi(
  endpoint: string,
  method: string,
  requestData: any,
  responseData: any,
  statusCode?: number,
  errorMessage?: string,
  duration?: number
) {
  try {
    await prisma.squareApiLog.create({
      data: {
        endpoint,
        method,
        requestData: requestData ? JSON.parse(JSON.stringify(requestData)) : null,
        responseData: responseData ? JSON.parse(JSON.stringify(responseData)) : null,
        statusCode,
        errorMessage,
        duration,
      },
    });
  } catch (error) {
    logger.error('Failed to log Square API call', { error });
  }
}

/**
 * Wrapper for Square API calls with logging
 */
export async function executeSquareRequest<T>(
  endpoint: string,
  method: string,
  request: () => Promise<T>,
  requestData?: any
): Promise<T> {
  const startTime = Date.now();

  try {
    const response = await request();
    const duration = Date.now() - startTime;

    await logSquareApi(
      endpoint,
      method,
      requestData,
      response,
      200,
      undefined,
      duration
    );

    logger.info(`Square API ${method} ${endpoint} succeeded`, {
      duration,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ApiError) {
      const statusCode = error.statusCode;
      const errors = error.errors;

      await logSquareApi(
        endpoint,
        method,
        requestData,
        { errors },
        statusCode,
        error.message,
        duration
      );

      logger.error(`Square API ${method} ${endpoint} failed`, {
        statusCode,
        errors,
        duration,
      });

      throw new SquareApiError(
        `Square API error: ${error.message}`,
        errors
      );
    }

    await logSquareApi(
      endpoint,
      method,
      requestData,
      null,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      duration
    );

    logger.error(`Square API ${method} ${endpoint} failed`, {
      error,
      duration,
    });

    throw error;
  }
}

/**
 * Get all team members
 */
export async function getTeamMembers() {
  return executeSquareRequest(
    'team.searchTeamMembers',
    'POST',
    async () => {
      const response = await teamApi.searchTeamMembers({
        query: {
          filter: {
            locationIds: [process.env.SQUARE_LOCATION_ID!],
            status: 'ACTIVE',
          },
        },
      });
      return response.result.teamMembers || [];
    }
  );
}

/**
 * Get catalog items (services)
 */
export async function getCatalogServices() {
  return executeSquareRequest(
    'catalog.searchCatalogItems',
    'POST',
    async () => {
      const response = await catalogApi.searchCatalogItems({
        objectTypes: ['ITEM'],
        query: {
          prefixQuery: {
            attributeName: 'name',
            attributePrefix: '',
          },
        },
      });
      return response.result.items || [];
    }
  );
}

/**
 * Get catalog item variations
 */
export async function getCatalogItemVariations(itemId: string) {
  return executeSquareRequest(
    'catalog.retrieveCatalogObject',
    'GET',
    async () => {
      const response = await catalogApi.retrieveCatalogObject(itemId, true);
      return response.result;
    }
  );
}

/**
 * Search for existing bookings
 */
export async function searchBookings(params: {
  locationId: string;
  startAtMin?: string;
  startAtMax?: string;
  teamMemberIds?: string[];
}) {
  return executeSquareRequest(
    'bookings.searchAvailability',
    'POST',
    async () => {
      const response = await bookingsApi.searchAvailability({
        query: {
          filter: {
            locationId: params.locationId,
            startAtRange: {
              startAt: params.startAtMin,
              endAt: params.startAtMax,
            },
            segmentFilters: params.teamMemberIds
              ? [
                  {
                    teamMemberIdFilter: {
                      any: params.teamMemberIds,
                    },
                  },
                ]
              : undefined,
          },
        },
      });
      return response.result.availabilities || [];
    },
    params
  );
}

/**
 * Create a booking
 */
export async function createBooking(params: {
  customerId: string;
  locationId: string;
  startAt: string;
  teamMemberId: string;
  serviceVariationId: string;
  serviceVariationVersion: bigint;
  customerNote?: string;
}) {
  return executeSquareRequest(
    'bookings.createBooking',
    'POST',
    async () => {
      const response = await bookingsApi.createBooking({
        booking: {
          customerId: params.customerId,
          locationId: params.locationId,
          startAt: params.startAt,
          appointmentSegments: [
            {
              durationMinutes: 30, // This will be overridden by service duration
              teamMemberId: params.teamMemberId,
              serviceVariationId: params.serviceVariationId,
              serviceVariationVersion: params.serviceVariationVersion,
            },
          ],
          customerNote: params.customerNote,
        },
      });
      return response.result.booking;
    },
    params
  );
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, version?: number) {
  return executeSquareRequest(
    'bookings.cancelBooking',
    'POST',
    async () => {
      const response = await bookingsApi.cancelBooking(bookingId, {
        bookingVersion: version,
      });
      return response.result.booking;
    },
    { bookingId, version }
  );
}

/**
 * Retrieve bookings for a location
 */
export async function retrieveBookings(params: {
  locationId: string;
  startAtMin?: string;
  startAtMax?: string;
  teamMemberIds?: string[];
}) {
  return executeSquareRequest(
    'bookings.listBookings',
    'GET',
    async () => {
      const response = await bookingsApi.listBookings(
        undefined,
        undefined,
        params.locationId,
        params.startAtMin,
        params.startAtMax
      );

      let bookings = response.result.bookings || [];

      // Filter by team member if specified
      if (params.teamMemberIds && params.teamMemberIds.length > 0) {
        bookings = bookings.filter((booking) =>
          booking.appointmentSegments?.some((segment) =>
            params.teamMemberIds?.includes(segment.teamMemberId!)
          )
        );
      }

      return bookings;
    },
    params
  );
}

/**
 * Search or create customer
 */
export async function upsertCustomer(params: {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
}) {
  // Search for existing customer
  if (params.email || params.phone) {
    const searchResult = await executeSquareRequest(
      'customers.searchCustomers',
      'POST',
      async () => {
        const response = await customersApi.searchCustomers({
          query: {
            filter: {
              emailAddress: params.email
                ? { exact: params.email }
                : undefined,
              phoneNumber: params.phone
                ? { exact: params.phone }
                : undefined,
            },
          },
        });
        return response.result.customers || [];
      },
      params
    );

    if (searchResult.length > 0) {
      return searchResult[0];
    }
  }

  // Create new customer
  return executeSquareRequest(
    'customers.createCustomer',
    'POST',
    async () => {
      const response = await customersApi.createCustomer({
        givenName: params.firstName,
        familyName: params.lastName,
        phoneNumber: params.phone,
        emailAddress: params.email,
      });
      return response.result.customer;
    },
    params
  );
}

export default squareClient;
