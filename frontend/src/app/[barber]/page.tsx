import Link from 'next/link';

interface BarberPageProps {
  params: {
    barber: string;
  };
}

// This will generate static pages for known barbers
export async function generateStaticParams() {
  // Add more barbers here as they join
  return [
    { barber: 'rick' },
    // { barber: 'john' },
    // { barber: 'mike' },
  ];
}

export default function BarberPage({ params }: BarberPageProps) {
  const barberName = params.barber.charAt(0).toUpperCase() + params.barber.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-burgundy-900">
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-gold-500 hover:text-gold-400 mb-8 inline-block">
            ← Back to Home
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-serif text-6xl font-bold text-white mb-6">
                Book with <span className="text-gold-500">{barberName}</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Professional barber specializing in signature cuts, fades, and beard grooming
              </p>
              <Link
                href={`/${params.barber}/book`}
                className="inline-block px-10 py-4 bg-burgundy-800 hover:bg-burgundy-700 text-white font-semibold rounded-lg text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Book Appointment
              </Link>
            </div>
            <div className="bg-gradient-to-br from-burgundy-800 to-navy-900 rounded-2xl h-96 flex items-center justify-center">
              <p className="text-white text-6xl font-serif">✂️</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 px-4 bg-navy-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-4xl font-bold text-white text-center mb-4">
            Services
          </h2>
          <div className="w-20 h-1 bg-gold-500 mx-auto mb-12"></div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { category: 'Haircuts', icon: '✂️', desc: 'Classic cuts & signature fades' },
              { category: 'Beard Grooming', icon: '🪒', desc: 'Precision trims & royal shaves' },
              { category: 'Premium', icon: '⭐', desc: 'VIP experience & packages' },
            ].map((service) => (
              <div
                key={service.category}
                className="bg-navy-800 rounded-xl p-8 border border-gold-500/20 hover:border-gold-500/50 transition-all"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{service.category}</h3>
                <p className="text-gray-300 mb-6">{service.desc}</p>
                <Link
                  href={`/${params.barber}/book`}
                  className="text-gold-500 hover:text-gold-400 font-semibold"
                >
                  Book Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-burgundy-800 to-navy-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl font-bold text-white mb-6">
            Ready to Book?
          </h2>
          <Link
            href={`/${params.barber}/book`}
            className="inline-block px-12 py-5 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-lg text-xl transition-all shadow-2xl hover:scale-105"
          >
            Book with {barberName}
          </Link>
        </div>
      </section>
    </div>
  );
}
