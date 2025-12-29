'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Service categories matching your Notion doc
const SERVICE_CATEGORIES = [
  {
    id: 'haircuts',
    name: 'Haircuts',
    icon: '✂️',
    services: [
      { id: 'classic-cut', name: 'Classic Cut', price: 45, duration: 45 },
      { id: 'signature-cut', name: 'Signature Cut', price: 55, duration: 60 },
      { id: 'drop-fade', name: 'Drop Fade', price: 50, duration: 50 },
    ],
  },
  {
    id: 'beard-grooming',
    name: 'Beard & Grooming',
    icon: '🪒',
    services: [
      { id: 'beard-trim', name: 'Beard Trim', price: 25, duration: 30 },
      { id: 'royal-shave', name: 'Royal Shave', price: 40, duration: 45 },
      { id: 'beard-lineup', name: 'Beard Line-Up', price: 20, duration: 20 },
    ],
  },
  {
    id: 'color-extras',
    name: 'Color & Extras',
    icon: '✨',
    services: [
      { id: 'gray-blending', name: 'Gray Blending', price: 35, duration: 30 },
      { id: 'hairline-enhancement', name: 'Hair Line Enhancement', price: 15, duration: 15 },
      { id: 'eyebrow-trim', name: 'Eyebrow Trim', price: 10, duration: 10 },
    ],
  },
  {
    id: 'premium',
    name: 'Premium Experience',
    icon: '⭐',
    services: [
      { id: 'vip-experience', name: 'VIP Experience', price: 120, duration: 90 },
      { id: 'father-son', name: 'Father & Son Package', price: 85, duration: 90 },
      { id: 'executive-package', name: 'Executive Package', price: 100, duration: 75 },
    ],
  },
];

export default function BookingPage() {
  const params = useParams();
  const barberSlug = params?.barber as string;
  const barberName = barberSlug?.charAt(0).toUpperCase() + barberSlug?.slice(1);

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setStep(3);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep(4);
  };

  const handleSubmit = async () => {
    // TODO: Integrate with Square API
    console.log('Booking:', {
      barber: barberSlug,
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      customer: customerInfo,
    });
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-burgundy-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/${barberSlug}`} className="text-gold-500 hover:text-gold-400 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="font-serif text-5xl font-bold text-white mb-2">
            Book with <span className="text-gold-500">{barberName}</span>
          </h1>
          <div className="flex items-center gap-4 mt-6">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? 'bg-gold-500' : 'bg-navy-700'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Category</span>
            <span>Service</span>
            <span>Date/Time</span>
            <span>Details</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step 1: Select Category */}
        {step === 1 && (
          <div className="bg-navy-800 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Select Service Category</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {SERVICE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="bg-navy-700 hover:bg-navy-600 rounded-xl p-6 text-left transition-all border-2 border-transparent hover:border-gold-500"
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-xl font-bold text-white">{category.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && selectedCategory && (
          <div className="bg-navy-800 rounded-2xl p-8">
            <button
              onClick={() => setStep(1)}
              className="text-gold-500 hover:text-gold-400 mb-4"
            >
              ← Change Category
            </button>
            <h2 className="text-3xl font-bold text-white mb-6">
              {SERVICE_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <div className="space-y-4">
              {SERVICE_CATEGORIES.find((c) => c.id === selectedCategory)?.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="w-full bg-navy-700 hover:bg-navy-600 rounded-xl p-6 text-left transition-all border-2 border-transparent hover:border-gold-500"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{service.name}</h3>
                      <p className="text-gray-400">{service.duration} minutes</p>
                    </div>
                    <div className="text-2xl font-bold text-gold-500">${service.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && selectedService && (
          <div className="bg-navy-800 rounded-2xl p-8">
            <button
              onClick={() => setStep(2)}
              className="text-gold-500 hover:text-gold-400 mb-4"
            >
              ← Change Service
            </button>
            <h2 className="text-3xl font-bold text-white mb-2">Select Date & Time</h2>
            <p className="text-gray-400 mb-6">
              {selectedService.name} - ${selectedService.price} ({selectedService.duration} min)
            </p>

            {/* Simple date/time picker - will integrate with Square availability */}
            <div className="mb-6">
              <label className="block text-white mb-2">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-navy-700 text-white px-4 py-3 rounded-lg border-2 border-navy-600 focus:border-gold-500 outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-white mb-2">Select Time</label>
              <div className="grid grid-cols-4 gap-3">
                {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'].map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      selectedTime === time
                        ? 'bg-gold-500 text-navy-900'
                        : 'bg-navy-700 text-white hover:bg-navy-600'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && selectedTime && (
              <button
                onClick={() => setStep(4)}
                className="w-full py-4 bg-burgundy-800 hover:bg-burgundy-700 text-white font-bold rounded-lg transition-all"
              >
                Continue
              </button>
            )}
          </div>
        )}

        {/* Step 4: Customer Details */}
        {step === 4 && (
          <div className="bg-navy-800 rounded-2xl p-8">
            <button
              onClick={() => setStep(3)}
              className="text-gold-500 hover:text-gold-400 mb-4"
            >
              ← Change Date/Time
            </button>
            <h2 className="text-3xl font-bold text-white mb-6">Your Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">First Name *</label>
                <input
                  type="text"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                  className="w-full bg-navy-700 text-white px-4 py-3 rounded-lg border-2 border-navy-600 focus:border-gold-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Last Name</label>
                <input
                  type="text"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                  className="w-full bg-navy-700 text-white px-4 py-3 rounded-lg border-2 border-navy-600 focus:border-gold-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Email *</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full bg-navy-700 text-white px-4 py-3 rounded-lg border-2 border-navy-600 focus:border-gold-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2">Phone *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full bg-navy-700 text-white px-4 py-3 rounded-lg border-2 border-navy-600 focus:border-gold-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!customerInfo.firstName || !customerInfo.email || !customerInfo.phone}
              className="w-full mt-6 py-4 bg-burgundy-800 hover:bg-burgundy-700 disabled:bg-navy-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
            >
              Confirm Booking
            </button>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="bg-navy-800 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Booking Confirmed!</h2>
            <p className="text-xl text-gray-300 mb-8">
              Your appointment with {barberName} is scheduled
            </p>

            <div className="bg-navy-700 rounded-xl p-6 mb-8 text-left">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Service</p>
                  <p className="text-white font-semibold">{selectedService.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Date & Time</p>
                  <p className="text-white font-semibold">{selectedDate} at {selectedTime}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Duration</p>
                  <p className="text-white font-semibold">{selectedService.duration} minutes</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Price</p>
                  <p className="text-white font-semibold">${selectedService.price}</p>
                </div>
              </div>
            </div>

            <Link
              href={`/${barberSlug}`}
              className="inline-block px-8 py-3 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-lg transition-all"
            >
              Back to Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
