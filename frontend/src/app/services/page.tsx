import { api } from '@/lib/api';
import { ServiceVariation } from '@/lib/types';

export default async function ServicesPage() {
  let services: ServiceVariation[] = [];
  let error: string | null = null;

  try {
    services = await api.getServices();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load services';
    console.error('Error fetching services:', err);
  }

  // Group by category
  const servicesByCategory: { [key: string]: ServiceVariation[] } = {};
  services.forEach((service) => {
    const category = service.categoryName || 'Services';
    if (!servicesByCategory[category]) {
      servicesByCategory[category] = [];
    }
    servicesByCategory[category].push(service);
  });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Our Services</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">
            <strong>Error loading services:</strong> {error}
          </p>
          <p className="text-sm text-red-600 mt-2">
            Make sure the backend API is running and accessible.
          </p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold mb-8">Our Services</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            <strong>No services found.</strong> Sync services from Square using
            the admin panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Our Services</h1>

      {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
        <div key={category} className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{category}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryServices.map((service) => (
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
                  className="btn btn-primary w-full text-center block"
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
