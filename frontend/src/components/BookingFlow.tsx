'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import { ServiceVariation, AvailabilitySlot, CustomerInfo } from '@/lib/types';
import { format, addDays, startOfDay, parseISO } from 'date-fns';

const DEFAULT_BARBER_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_BARBER_SLUG || 'your-slug';

interface BookingFlowProps {
  preselectedServiceId?: string;
}

export default function BookingFlow({ preselectedServiceId }: BookingFlowProps) {
  const [step, setStep] = useState(preselectedServiceId ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [services, setServices] = useState<ServiceVariation[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceVariation | null>(
    null
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    preselectedServiceId || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);

  // Load services
  useEffect(() => {
    if (step === 1) {
      loadServices();
    }
  }, [step]);

  // Load service details when preselected
  useEffect(() => {
    if (preselectedServiceId) {
      loadServiceDetails(preselectedServiceId);
    }
  }, [preselectedServiceId]);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceDetails = async (serviceId: string) => {
    try {
      const data = await api.getServices();
      const service = data.find((s) => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        setSelectedServiceId(serviceId);
      }
    } catch (err) {
      console.error('Error loading service details:', err);
    }
  };

  const handleServiceSelect = (service: ServiceVariation) => {
    setSelectedService(service);
    setSelectedServiceId(service.id);
    setStep(2);
  };

  const loadAvailability = async (date: Date) => {
    if (!selectedServiceId) return;

    setLoading(true);
    setError(null);

    try {
      const dateFrom = format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ss");
      const dateTo = format(addDays(startOfDay(date), 1), "yyyy-MM-dd'T'HH:mm:ss");

      const slots = await api.getAvailability({
        barberSlug: DEFAULT_BARBER_SLUG,
        serviceVariationId: selectedServiceId,
        dateFrom,
        dateTo,
      });

      setAvailableSlots(slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    loadAvailability(date);
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
  };

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateCustomerInfo = (): boolean => {
    if (!customerInfo.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (customerInfo.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(customerInfo.phone)) {
      setError('Please enter a valid phone number');
      return false;
    }
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!customerInfo.phone && !customerInfo.email) {
      setError('Please provide either phone or email');
      return false;
    }
    return true;
  };

  const handleBooking = async () => {
    if (!selectedSlot || !selectedService) return;

    if (!validateCustomerInfo()) return;

    setLoading(true);
    setError(null);

    try {
      const booking = await api.createBooking({
        barber_slug: DEFAULT_BARBER_SLUG,
        service_variation_id: selectedService.id,
        start_at: selectedSlot.startAt,
        customer_info: customerInfo,
      });

      setBookingConfirmation(booking);
      setStep(4);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Render steps
  if (step === 1) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Select a Service</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {loading ? (
          <p>Loading services...</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="card cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-600 mb-4">{service.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{service.duration} min</span>
                  <span className="text-lg font-bold">
                    ${(service.price / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 2) {
    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Select Date & Time</h2>
        {selectedService && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">{selectedService.name}</p>
            <p className="text-sm text-gray-600">
              {selectedService.duration} min • ${(selectedService.price / 100).toFixed(2)}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Date selector */}
        <div className="mb-6">
          <h3 className="font-bold mb-3">Choose a Date</h3>
          <div className="grid grid-cols-7 gap-2">
            {dates.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                className={`p-3 rounded-lg border text-center ${
                  selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-300 hover:border-primary-600'
                }`}
              >
                <div className="text-xs">{format(date, 'EEE')}</div>
                <div className="text-lg font-bold">{format(date, 'd')}</div>
                <div className="text-xs">{format(date, 'MMM')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <h3 className="font-bold mb-3">Choose a Time</h3>
            {loading ? (
              <p>Loading available times...</p>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.startAt}
                    onClick={() => handleSlotSelect(slot)}
                    className={`p-3 rounded-lg border font-medium ${
                      selectedSlot?.startAt === slot.startAt
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 hover:border-primary-600'
                    }`}
                  >
                    {format(parseISO(slot.startAt), 'h:mm a')}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No available times for this date</p>
            )}
          </div>
        )}

        {selectedSlot && (
          <button
            onClick={() => setStep(3)}
            className="btn btn-primary mt-6"
          >
            Continue to Details
          </button>
        )}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Details</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Booking summary */}
        {selectedService && selectedSlot && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">{selectedService.name}</p>
            <p className="text-sm text-gray-600">
              {format(parseISO(selectedSlot.startAt), 'EEEE, MMMM d, yyyy')} at{' '}
              {format(parseISO(selectedSlot.startAt), 'h:mm a')}
            </p>
          </div>
        )}

        {/* Customer form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={customerInfo.lastName}
              onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
              placeholder="+1-555-123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button onClick={() => setStep(2)} className="btn btn-secondary">
            Back
          </button>
          <button
            onClick={handleBooking}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 4 && bookingConfirmation) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-gray-600">Your appointment has been scheduled</p>
        </div>

        {selectedService && selectedSlot && (
          <div className="card text-left max-w-md mx-auto">
            <h3 className="font-bold text-lg mb-4">Appointment Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-medium">{selectedService.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-medium">
                  {format(parseISO(selectedSlot.startAt), 'EEEE, MMMM d, yyyy')}
                  <br />
                  {format(parseISO(selectedSlot.startAt), 'h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">{selectedService.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">The Signature Chair</p>
              </div>
            </div>
          </div>
        )}

        <a href="/" className="btn btn-primary mt-6 inline-block">
          Back to Home
        </a>
      </div>
    );
  }

  return null;
}
