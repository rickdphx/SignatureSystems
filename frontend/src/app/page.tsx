export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6">
          Welcome to The Signature Chair
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional barber services - Book your appointment online
        </p>
        <div className="space-x-4">
          <a href="/services" className="btn btn-primary text-lg px-8 py-3">
            View Services
          </a>
          <a
            href="/book"
            className="btn btn-secondary text-lg px-8 py-3"
          >
            Book Appointment
          </a>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <h3 className="text-xl font-bold mb-2">Expert Barbers</h3>
          <p className="text-gray-600">
            Professional cuts and styling by experienced barbers
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-xl font-bold mb-2">Online Booking</h3>
          <p className="text-gray-600">
            Book your appointment 24/7 from any device
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-xl font-bold mb-2">Quality Service</h3>
          <p className="text-gray-600">
            Premium products and attention to detail
          </p>
        </div>
      </div>
    </div>
  );
}
