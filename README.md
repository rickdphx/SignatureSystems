# SignatureChair Booking Backend

Headless booking backend for **signaturechair.com** with Square integration. This is a multi-barber booking system that provides clean REST APIs for web and mobile frontends.

## Overview

This backend powers the booking engine for SignatureChair, a barbershop with multiple barbers. It integrates with Square for:
- Team member management (barbers)
- Service catalog
- Customer management
- Booking/appointment creation and management

## Tech Stack

- **Node.js** (18+) with **TypeScript**
- **Express.js** - REST API framework
- **PostgreSQL** - Primary database
- **Prisma ORM** - Database ORM and migrations
- **Square API** - Payment and booking platform
- **Docker** - Containerization
- **Winston** - Structured logging

## Features

### Multi-Barber Support
- Each barber maps to a Square team member
- Barber profiles with bio, avatar, specialties
- Service assignments per barber
- Auto-assignment for walk-ins

### Booking Management
- Real-time availability checking
- Booking creation with Square sync
- Booking cancellation
- Booking history

### Public APIs
- Public endpoints for frontend consumption
- Barber profiles and services
- Availability checking
- Online booking creation

### Voice Intake
- Phone booking support
- Call logging
- Auto barber assignment

### Logging & Auditing
- Structured logs with Winston
- Square API request/response logging
- Call logs for voice intake

## Project Structure

```
SignatureSystems/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── clients/
│   │   └── square.ts          # Square API client
│   ├── middleware/
│   │   └── errorHandler.ts   # Error handling middleware
│   ├── routes/
│   │   ├── barber.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── service.routes.ts
│   │   ├── availability.routes.ts
│   │   ├── public.routes.ts
│   │   ├── voice.routes.ts
│   │   └── square.routes.ts
│   ├── services/
│   │   ├── barber.service.ts
│   │   ├── barberService.service.ts
│   │   ├── booking.service.ts
│   │   ├── catalog.service.ts
│   │   ├── availability.service.ts
│   │   └── voice.service.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── helpers.ts
│   ├── app.ts                 # Express app setup
│   └── index.ts               # Server entry point
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- Square account with API credentials
- Square location ID
- Square team members set up

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd SignatureSystems
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Square credentials:
   ```env
   SQUARE_ACCESS_TOKEN=your_square_access_token
   SQUARE_ENVIRONMENT=sandbox  # or 'production'
   SQUARE_LOCATION_ID=your_square_location_id
   ```

4. **Start PostgreSQL** (if using Docker)
   ```bash
   docker-compose up -d postgres
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma client**
   ```bash
   npm run prisma:generate
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Using Docker

To run the entire stack with Docker:

```bash
docker-compose up
```

This will start:
- PostgreSQL database
- Node.js API server

## API Documentation

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.signaturechair.com/api`

---

## Endpoints

### Barber Management

#### Sync Barbers from Square
```http
POST /api/barbers/sync-from-square
```

Syncs all active Square team members to the local Barber database.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "barbers": [...]
}
```

#### Get All Barbers
```http
GET /api/barbers?active=true
```

**Query Parameters:**
- `active` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "count": 3,
  "barbers": [
    {
      "id": "uuid",
      "squareTeamMemberId": "TMxxxx",
      "slug": "john-doe",
      "displayName": "John Doe",
      "bio": "Master barber with 10 years experience",
      "avatarUrl": "https://...",
      "specialties": ["fades", "beards"],
      "isActive": true
    }
  ]
}
```

#### Get Barber by Slug
```http
GET /api/barbers/:slug
```

**Response:**
```json
{
  "success": true,
  "barber": {
    "id": "uuid",
    "slug": "john-doe",
    "displayName": "John Doe",
    "services": [...]
  }
}
```

#### Update Barber
```http
PATCH /api/barbers/:id
```

**Request Body:**
```json
{
  "displayName": "John Doe",
  "bio": "Expert in fades and beards",
  "avatarUrl": "https://...",
  "specialties": ["fades", "beards", "kids cuts"],
  "slug": "john-doe",
  "isActive": true
}
```

#### Get Barber Services
```http
GET /api/barbers/:slug/services
```

Returns all services offered by a barber.

#### Assign Services to Barber
```http
POST /api/barbers/:id/services
```

**Request Body:**
```json
{
  "serviceVariationIds": ["variation_id_1", "variation_id_2"]
}
```

---

### Services

#### Get All Services
```http
GET /api/services
```

Returns all service variations from Square catalog.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "services": [
    {
      "id": "variation_id",
      "name": "Haircut",
      "duration": 30,
      "price": 3000,
      "version": 1,
      "itemName": "Haircut Service"
    }
  ]
}
```

---

### Availability

#### Check Availability
```http
GET /api/availability?location_id=xxx&service_variation_id=xxx&date_from=xxx&date_to=xxx&barber_slug=john-doe
```

**Query Parameters:**
- `location_id` (required): Square location ID
- `service_variation_id` (required): Service variation ID
- `date_from` (required): ISO 8601 date
- `date_to` (required): ISO 8601 date
- `team_member_id` (optional): Square team member ID
- `barber_slug` (optional): Barber slug

**Response:**
```json
{
  "success": true,
  "count": 12,
  "slots": [
    {
      "startAt": "2025-12-27T09:00:00.000Z",
      "endAt": "2025-12-27T09:30:00.000Z",
      "duration": 30
    }
  ]
}
```

---

### Bookings

#### Create Booking
```http
POST /api/bookings/create
```

**Request Body:**
```json
{
  "customer_info": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+15555551234",
    "email": "jane@example.com"
  },
  "location_id": "location_xxx",
  "barber_slug": "john-doe",
  "service_variation_id": "variation_xxx",
  "service_variation_version": 1,
  "start_at": "2025-12-27T10:00:00.000Z",
  "note": "Need a fade",
  "source": "web"
}
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "squareBookingId": "booking_xxx",
    "status": "PENDING",
    "startAt": "2025-12-27T10:00:00.000Z",
    "duration": 30
  }
}
```

#### List Bookings
```http
GET /api/bookings/list?date_from=xxx&date_to=xxx&barber_slug=john-doe
```

**Query Parameters:**
- `date_from` (optional): ISO 8601 date
- `date_to` (optional): ISO 8601 date
- `location_id` (optional)
- `team_member_id` (optional)
- `barber_slug` (optional)
- `customer_id` (optional)

#### Cancel Booking
```http
POST /api/bookings/:id/cancel
```

---

### Public Endpoints (for frontend)

#### Get All Barbers (Public)
```http
GET /api/public/barbers
```

Returns only public fields (no internal IDs).

#### Get Barber Profile (Public)
```http
GET /api/public/barbers/:slug
```

#### Check Availability (Public)
```http
GET /api/public/barbers/:slug/availability?service_variation_id=xxx&date_from=xxx&date_to=xxx
```

#### Create Booking (Public)
```http
POST /api/public/bookings
```

**Request Body:**
```json
{
  "customer_info": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+15555551234",
    "email": "jane@example.com"
  },
  "barber_slug": "john-doe",
  "service_variation_id": "variation_xxx",
  "start_at": "2025-12-27T10:00:00.000Z",
  "note": "Optional note"
}
```

#### Get All Services (Public)
```http
GET /api/public/services
```

---

### Voice Intake

#### Handle Voice Intake
```http
POST /api/voice/intake
```

**Request Body:**
```json
{
  "call_sid": "CAxxxx",
  "customer_name": "John Smith",
  "customer_phone": "+15555551234",
  "service_variation_id": "variation_xxx",
  "requested_date_time": "2025-12-27T14:00:00.000Z",
  "barber_slug": "john-doe",
  "note": "Called from phone"
}
```

If `barber_slug` is not provided, the system will auto-assign an available barber.

#### Get Call Logs
```http
GET /api/voice/logs?status=completed&limit=50
```

---

### Square Admin

#### Get Team Members
```http
GET /api/square/team-members
```

Returns all active Square team members.

---

## Database Schema

### Barber
- `id` - UUID
- `squareTeamMemberId` - Square team member ID (unique)
- `slug` - URL-friendly slug (unique)
- `displayName` - Display name
- `bio` - Biography
- `avatarUrl` - Avatar image URL
- `specialties` - Array of specialties
- `isActive` - Active status

### BarberService
- Links barbers to services they offer
- `barberId` - FK to Barber
- `serviceVariationId` - Square service variation ID
- `isActive` - Active status

### Customer
- `id` - UUID
- `squareCustomerId` - Square customer ID
- `firstName` - First name
- `lastName` - Last name
- `phone` - Phone number
- `email` - Email address

### Booking
- `id` - UUID
- `squareBookingId` - Square booking ID
- `customerId` - FK to Customer
- `barberId` - FK to Barber
- `locationId` - Square location ID
- `teamMemberId` - Square team member ID
- `serviceVariationId` - Service variation ID
- `serviceVariationVersion` - Service version
- `startAt` - Appointment start time
- `duration` - Duration in minutes
- `status` - Booking status
- `source` - Booking source (phone, web, manual)
- `customerNote` - Customer note
- `squareRequestPayload` - Request payload (for debugging)
- `squareResponsePayload` - Response payload (for debugging)

### CallLog
- Logs for voice intake
- `callSid` - Twilio call SID
- `customerPhone` - Customer phone
- `customerName` - Customer name
- `barberSlug` - Assigned barber
- `serviceRequested` - Requested service
- `requestedDateTime` - Requested time
- `status` - Call status

---

## Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `SQUARE_ACCESS_TOKEN` - Square API access token
- `SQUARE_LOCATION_ID` - Square location ID

**Optional:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `SQUARE_ENVIRONMENT` - Square environment (sandbox/production)
- `LOG_LEVEL` - Logging level (default: info)
- `ALLOWED_ORIGINS` - CORS allowed origins

---

## Development Workflow

### Setting Up Your Barber Profile

1. **Sync barbers from Square:**
   ```bash
   curl -X POST http://localhost:3000/api/barbers/sync-from-square
   ```

2. **Find your barber ID:**
   ```bash
   curl http://localhost:3000/api/barbers
   ```

3. **Update your profile:**
   ```bash
   curl -X PATCH http://localhost:3000/api/barbers/{your-id} \
     -H "Content-Type: application/json" \
     -d '{
       "displayName": "Your Name",
       "slug": "your-name",
       "bio": "Master barber specializing in fades",
       "avatarUrl": "https://...",
       "specialties": ["fades", "beards", "kids cuts"]
     }'
   ```

4. **Assign services:**
   ```bash
   curl -X POST http://localhost:3000/api/barbers/{your-id}/services \
     -H "Content-Type: application/json" \
     -d '{
       "serviceVariationIds": ["variation_1", "variation_2"]
     }'
   ```

### Database Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations
npm run prisma:deploy

# Open Prisma Studio
npm run prisma:studio
```

### Running Tests

```bash
npm test
```

### Logs

Logs are stored in `./logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

---

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use production Square credentials
3. Set `SQUARE_ENVIRONMENT=production`
4. Configure proper CORS origins
5. Set secure database credentials
6. Enable SSL for PostgreSQL
7. Set up log rotation
8. Configure rate limiting appropriately

### Docker Production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Support

For issues or questions:
- GitHub Issues: [repo-url]/issues
- Email: support@signaturechair.com

---

## License

MIT License - See LICENSE file for details

---

## Architecture Notes

### Multi-Barber Design
- Each barber is a Square team member
- Bookings are always tied to: location_id + team_member_id + service_variation_id
- Barber profiles are local enhancements to Square team members
- Services can be assigned per barber for future flexibility

### Auto-Assignment Strategy
When no barber is specified (e.g., walk-ins or voice intake), the system uses the first active barber. This can be enhanced with:
- Load balancing (barber with fewest bookings)
- Round-robin assignment
- Skill-based routing
- Customer preference history

### Availability Logic
- Business hours: 9 AM - 6 PM (configurable in code)
- Slot interval: 15 minutes
- Prevents double-booking
- Respects existing Square bookings

### Logging & Debugging
- All Square API requests/responses are logged
- Request payloads stored in `squareRequestPayload`
- Response payloads stored in `squareResponsePayload`
- Structured logs with Winston
- Separate error logs

---

**Built for signaturechair.com**
