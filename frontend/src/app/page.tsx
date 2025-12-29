import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-burgundy-900">
      {/* Hero Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-serif text-6xl md:text-7xl font-bold text-white mb-6">
            The <span className="text-gold-500">Signature</span> Chair
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-2xl mx-auto">
            Premium Grooming Experience
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-xl mx-auto">
            Tempe • Phoenix • Scottsdale • Sky Harbor
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/book"
              className="px-10 py-4 bg-burgundy-800 hover:bg-burgundy-700 text-white font-semibold rounded-lg text-lg transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Book Appointment
            </Link>
            <Link
              href="/services"
              className="px-10 py-4 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-lg text-lg transition-all border-2 border-gold-500"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      {/* About Rick Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-5xl font-bold text-navy-900 mb-6">
                Meet Rick
              </h2>
              <div className="w-20 h-1 bg-gold-500 mb-8"></div>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Professional barber with over a decade of experience crafting signature styles
                for discerning clients across the Phoenix metro area.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Specializing in classic cuts, modern fades, and precision beard work.
                Every appointment is a personalized grooming experience designed around you.
              </p>
              <Link
                href="/book"
                className="inline-block px-8 py-3 bg-burgundy-800 hover:bg-burgundy-700 text-white font-semibold rounded-lg transition-all"
              >
                Book with Rick
              </Link>
            </div>
            <div className="bg-gradient-to-br from-burgundy-800 to-navy-900 rounded-2xl h-96 flex items-center justify-center">
              <p className="text-white text-6xl font-serif">✂️</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Highlight */}
      <section className="py-20 px-4 bg-navy-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-5xl font-bold text-white text-center mb-4">
            Signature Services
          </h2>
          <div className="w-20 h-1 bg-gold-500 mx-auto mb-16"></div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Classic Cuts',
                description: 'Timeless styles executed with modern precision',
                icon: '✂️',
              },
              {
                title: 'Signature Fades',
                description: 'Smooth blends and sharp lineups',
                icon: '💈',
              },
              {
                title: 'Beard Sculpting',
                description: 'Shape and maintain your perfect beard',
                icon: '🪒',
              },
            ].map((service) => (
              <div
                key={service.title}
                className="bg-navy-800 rounded-xl p-8 hover:bg-navy-700 transition-all border border-gold-500/20 hover:border-gold-500/50"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-gray-300 mb-6">{service.description}</p>
                <Link
                  href="/services"
                  className="text-gold-500 hover:text-gold-400 font-semibold"
                >
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-5xl font-bold text-navy-900 mb-4">
            Serving the Valley
          </h2>
          <div className="w-20 h-1 bg-gold-500 mx-auto mb-12"></div>
          <div className="grid md:grid-cols-4 gap-8">
            {['Tempe', 'Phoenix', 'Scottsdale', 'Sky Harbor'].map((location) => (
              <div
                key={location}
                className="bg-gradient-to-br from-burgundy-50 to-navy-50 rounded-lg p-8 hover:shadow-xl transition-all"
              >
                <h3 className="text-2xl font-bold text-navy-900 mb-2">{location}</h3>
                <p className="text-gray-600">Premium grooming services</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-burgundy-800 to-navy-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-5xl font-bold text-white mb-6">
            Ready for Your Signature Look?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Book your appointment today and experience the difference
          </p>
          <Link
            href="/book"
            className="inline-block px-12 py-5 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-lg text-xl transition-all shadow-2xl hover:scale-105"
          >
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
