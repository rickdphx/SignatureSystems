export default async function AdminSettingsPage() {
  // TODO: Fetch Square summary from API
  // const API_URL = process.env.NEXT_PUBLIC_API_URL;
  // const res = await fetch(`${API_URL}/admin/square/summary`, {
  //   cache: 'no-store',
  // });
  // const data = await res.json();
  // const summary = data.summary;

  // Mock data for initial setup
  const mockSummary = {
    location: {
      id: 'L123ABC',
      name: 'The Signature Chair',
      address: {
        addressLine1: '123 Main St',
        locality: 'Phoenix',
        administrativeDistrictLevel1: 'AZ',
        postalCode: '85001',
      },
      phoneNumber: '+1-555-123-4567',
      status: 'ACTIVE',
    },
    teamMembers: {
      total: 1,
      mappedToBarbers: 1,
      members: [
        {
          id: 'TM123',
          givenName: 'Your',
          familyName: 'Name',
          status: 'ACTIVE',
          mappedToBarber: true,
          barberInfo: {
            slug: 'your-slug',
            displayName: 'Your Name',
            isActive: true,
          },
        },
      ],
    },
    services: {
      totalServices: 2,
      categories: [
        {
          name: 'Haircuts',
          serviceCount: 1,
          services: [
            {
              id: 'SV1',
              name: 'Haircut',
              duration: 30,
              price: 4000,
            },
          ],
        },
      ],
    },
    configuration: {
      environment: 'sandbox',
      domain: 'thesignaturechair.com',
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Admin Settings</h1>

      {/* TODO: Replace with actual API call */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800">
          <strong>TODO:</strong> This page shows mock data. Uncomment the API
          fetch code above to load real Square configuration from{' '}
          <code>/api/admin/square/summary</code>
        </p>
      </div>

      {/* Location Info */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Location Information</h2>
        {mockSummary.location && (
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-600">Location ID</dt>
              <dd className="font-mono">{mockSummary.location.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Name</dt>
              <dd>{mockSummary.location.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Address</dt>
              <dd>
                {mockSummary.location.address?.addressLine1}
                <br />
                {mockSummary.location.address?.locality},{' '}
                {mockSummary.location.address?.administrativeDistrictLevel1}{' '}
                {mockSummary.location.address?.postalCode}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Phone</dt>
              <dd>{mockSummary.location.phoneNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Status</dt>
              <dd>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  {mockSummary.location.status}
                </span>
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Team Members */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Team Members & Barbers</h2>
        <p className="text-gray-600 mb-4">
          Total: {mockSummary.teamMembers.total} | Mapped to Barbers:{' '}
          {mockSummary.teamMembers.mappedToBarbers}
        </p>
        <div className="space-y-4">
          {mockSummary.teamMembers.members.map((member) => (
            <div
              key={member.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">
                  {member.givenName} {member.familyName}
                </p>
                <p className="text-sm text-gray-600">ID: {member.id}</p>
                {member.barberInfo && (
                  <p className="text-sm text-green-600">
                    Mapped to: {member.barberInfo.displayName} (
                    {member.barberInfo.slug})
                  </p>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  member.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {member.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Services</h2>
        <p className="text-gray-600 mb-4">
          Total Services: {mockSummary.services.totalServices}
        </p>
        {mockSummary.services.categories.map((category) => (
          <div key={category.name} className="mb-6">
            <h3 className="text-lg font-bold mb-2">
              {category.name} ({category.serviceCount})
            </h3>
            <div className="space-y-2">
              {category.services.map((service) => (
                <div
                  key={service.id}
                  className="border rounded p-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-600">
                      ID: {service.id} | {service.duration} min
                    </p>
                  </div>
                  <span className="font-bold">
                    ${(service.price / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Configuration</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600">Environment</dt>
            <dd className="font-mono">
              {mockSummary.configuration.environment}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600">Domain</dt>
            <dd className="font-mono">{mockSummary.configuration.domain}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
