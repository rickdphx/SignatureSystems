'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('serviceId');

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(preselectedServiceId || '');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    note: '',
  });

  /* TODO: Implement booking flow steps
   *
   * Step 1: Select Service (if not preselected)
   * - Fetch services from /api/public/services
   * - Show service cards
   * - Set selectedService and move to step 2
   *
   * Step 2: Select Date & Time
   * - Get DEFAULT_BARBER_SLUG from env
   * - Fetch availability from /api/public/barbers/{slug}/availability
   * - Show calendar + time slots
   * - Set selectedSlot and move to step 3
   *
   * Step 3: Customer Details
   * - Form for firstName, lastName, phone, email, note
   * - Validate phone and email
   * - On submit, call POST /api/public/bookings
   *
   * Step 4: Confirmation
   * - Show booking details
   * - Show confirmation message
   */

  const handleBooking = async () => {
    // TODO: Implement booking API call
    /* const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const DEFAULT_BARBER_SLUG = process.env.NEXT_PUBLIC_DEFAULT_BARBER_SLUG;

    const response = await fetch(`${API_URL}/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barber_slug: DEFAULT_BARBER_SLUG,
        service_variation_id: selectedService,
        start_at: selectedSlot,
        customer_info: customerInfo,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setStep(4); // Show confirmation
    }
    */

    console.log('Booking:', {
      service: selectedService,
      slot: selectedSlot,
      customer: customerInfo,
    });
    alert('Booking submitted! (TODO: Implement API call)');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Book Your Appointment</h1>

      {/* Progress indicator */}
      <div className="flex justify-between mb-12">
        {['Service', 'Date & Time', 'Details', 'Confirm'].map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center ${
              i + 1 <= step ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                i + 1 <= step ? 'bg-primary-600 text-white' : 'bg-gray-300'
              }`}
            >
              {i + 1}
            </div>
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* TODO: Implement actual booking flow */}
      <div className="card">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold mb-2">TODO: Implement Booking Flow</h3>
          <p className="text-sm text-gray-700 mb-4">
            This is a placeholder booking page. Implement the multi-step flow:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <strong>Step 1:</strong> Service selection (fetch from{' '}
              <code>/api/public/services</code>)
            </li>
            <li>
              <strong>Step 2:</strong> Date & time picker (fetch availability
              from <code>/api/public/barbers/[slug]/availability</code>)
            </li>
            <li>
              <strong>Step 3:</strong> Customer info form
            </li>
            <li>
              <strong>Step 4:</strong> Confirmation (after POST to{' '}
              <code>/api/public/bookings</code>)
            </li>
          </ol>
          <div className="mt-4">
            <p className="text-sm text-gray-700">
              <strong>Current Step:</strong> {step}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setStep(Math.min(4, step + 1))}
                className="btn btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
