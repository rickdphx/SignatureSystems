// API Types
export interface ServiceVariation {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  version: number;
  categoryName?: string;
}

export interface Barber {
  id: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  specialties: string[];
  isActive: boolean;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
  duration: number;
}

export interface CustomerInfo {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export interface Booking {
  id: string;
  squareBookingId?: string;
  status: string;
  startAt: string;
  duration: number;
  customer: CustomerInfo;
}

export interface CreateBookingRequest {
  barber_slug: string;
  service_variation_id: string;
  start_at: string;
  customer_info: CustomerInfo;
  note?: string;
}

export interface SquareSummary {
  location: {
    id: string;
    name: string;
    address: any;
    phoneNumber: string;
    status: string;
  };
  teamMembers: {
    total: number;
    mappedToBarbers: number;
    members: any[];
  };
  services: {
    totalServices: number;
    categories: Array<{
      name: string;
      serviceCount: number;
      services: ServiceVariation[];
    }>;
  };
  configuration: {
    environment: string;
    domain: string;
  };
}
