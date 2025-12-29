import {
  ServiceVariation,
  Barber,
  AvailabilitySlot,
  Booking,
  CreateBookingRequest,
  SquareSummary,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || 'API request failed',
        response.status,
        data.error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error - could not connect to API');
  }
}

// Public API endpoints
export const api = {
  // Services
  async getServices(): Promise<ServiceVariation[]> {
    const data = await fetchAPI<{ success: boolean; services: ServiceVariation[] }>(
      '/public/services'
    );
    return data.services || [];
  },

  // Barbers
  async getBarbers(): Promise<Barber[]> {
    const data = await fetchAPI<{ success: boolean; barbers: Barber[] }>(
      '/public/barbers'
    );
    return data.barbers || [];
  },

  async getBarber(slug: string): Promise<Barber & { services: ServiceVariation[] }> {
    const data = await fetchAPI<{ success: boolean; barber: any }>(
      `/public/barbers/${slug}`
    );
    return data.barber;
  },

  // Availability
  async getAvailability(params: {
    barberSlug: string;
    serviceVariationId: string;
    dateFrom: string;
    dateTo: string;
  }): Promise<AvailabilitySlot[]> {
    const query = new URLSearchParams({
      service_variation_id: params.serviceVariationId,
      date_from: params.dateFrom,
      date_to: params.dateTo,
    });

    const data = await fetchAPI<{ success: boolean; slots: AvailabilitySlot[] }>(
      `/public/barbers/${params.barberSlug}/availability?${query}`
    );
    return data.slots || [];
  },

  // Bookings
  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    const data = await fetchAPI<{ success: boolean; booking: Booking }>(
      '/public/bookings',
      {
        method: 'POST',
        body: JSON.stringify(booking),
      }
    );
    return data.booking;
  },

  // Admin
  async getSquareSummary(): Promise<SquareSummary> {
    const data = await fetchAPI<{ success: boolean; summary: SquareSummary }>(
      '/admin/square/summary'
    );
    return data.summary;
  },

  // Voice intake
  async createVoiceIntake(params: {
    customerName: string;
    customerPhone: string;
    serviceVariationId?: string;
    requestedDateTime: string;
    barberSlug?: string;
    note?: string;
  }): Promise<any> {
    return await fetchAPI('/voice/intake', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        service_variation_id: params.serviceVariationId,
        requested_date_time: params.requestedDateTime,
        barber_slug: params.barberSlug,
        note: params.note,
      }),
    });
  },
};

export { ApiError };
