'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingFlow from '@/components/BookingFlow';

function BookingContent() {
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('serviceId') || undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Book Your Appointment</h1>
      <BookingFlow preselectedServiceId={preselectedServiceId} />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><p>Loading...</p></div>}>
      <BookingContent />
    </Suspense>
  );
}
