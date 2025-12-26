export default async function ServicesPage() {
  // TODO: Fetch services from API
  // const API_URL = process.env.NEXT_PUBLIC_API_URL;
  // const res = await fetch(`${API_URL}/public/services`, { cache: 'no-store' });
  // const data = await res.json();
  // const services = data.services || [];

  // Mock data for initial setup
  const mockServices = [
    {
      id: '1',
      name: 'Haircut',
      description: 'Professional haircut and styling',
      duration: 30,
      price: 4000,
      categoryName: 'Haircuts',
    },
    {
      id: '2',
      name: 'Beard Trim',
      description: 'Precision beard trimming and shaping',
      duration: 20,
      price: 2500,
      categoryName: 'Grooming',
    },
  ];

  // Group by category
  const servicesByCategory: { [key: string]: typeof mockServices } = {};
  mockServices.forEach((service) => {
    const category = service.categoryName || 'Services';
    if (!servicesByCategory[category]) {
      servicesByCategory[category] = [];
    }
    servicesByCategory[category].push(service);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Our Services</h1>

      {/* TODO: Replace with actual API call */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800">
          <strong>TODO:</strong> This page currently shows mock data. Uncomment
          the API fetch code above to load real services from your backend at{' '}
          <code>/api/public/services</code>
        </p>
      </div>

      {Object.entries(servicesByCategory).map(([category, services]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{category}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="card">
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-600 mb-4">{service.description}</p>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-700">{service.duration} min</span>
                  <span className="text-lg font-bold">
                    ${(service.price / 100).toFixed(2)}
                  </span>
                </div>
                <a
                  href={`/book?serviceId=${service.id}`}
                  className="btn btn-primary w-full text-center"
                >
                  Book Now
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
