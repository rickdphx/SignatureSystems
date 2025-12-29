# The Signature Chair - Frontend

Next.js frontend for **thesignaturechair.com** booking system.

## Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Configuration

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=your-slug-here
NEXT_PUBLIC_LOCATION_ID=your_square_location_id
```

### Get Your Barber Slug

After syncing barbers from Square:
```bash
curl http://localhost:3000/api/barbers
```

Find your barber record and copy the `slug` field to `NEXT_PUBLIC_DEFAULT_BARBER_SLUG`.

### Run Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## Pages

### `/` - Home Page
Landing page with navigation to services and booking.

### `/services` - Services Page
Displays all services grouped by category. Each service shows:
- Name and description
- Duration and price
- "Book" button

### `/book` - Booking Flow
Multi-step booking process:

**Step 1**: Choose service (if not pre-selected)
**Step 2**: Choose date and time
**Step 3**: Enter customer details
**Step 4**: Confirmation

URL patterns:
- `/book` - Start booking flow
- `/book?serviceId=xxx` - Pre-select service

### `/admin/settings` - Admin Settings
**Protected route** showing Square configuration:
- Location details
- Team members and barber mappings
- Services by category
- Current environment settings

## Components

### Receptionist Widget
Digital assistant widget that slides up from bottom-right.

**Features**:
- Text-based chat interface
- Collects customer info (name, phone, service,preferred time)
- Calls `/api/voice/intake` to create booking
- Shows confirmation or suggests alternatives

**Usage**: Automatically loads on all pages.

## API Integration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_DEFAULT_BARBER_SLUG` | Your barber slug | `rick-doe` |
| `NEXT_PUBLIC_LOCATION_ID` | Square location ID | `L123ABC` |
| `NEXT_PUBLIC_DOMAIN` | Your domain | `thesignaturechair.com` |

### API Calls

All API calls go through `src/lib/api.ts`:

```typescript
import { apiClient } from '@/lib/api';

// Get services
const services = await apiClient.get('/public/services');

// Get availability
const slots = await apiClient.get(`/public/barbers/${slug}/availability`, {
  params: { service_variation_id, date_from, date_to }
});

// Create booking
const booking = await apiClient.post('/public/bookings', {
  barber_slug,
  service_variation_id,
  start_at,
  customer_info: { firstName, lastName, phone, email }
});
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   ├── services/
│   │   │   └── page.tsx         # Services page
│   │   ├── book/
│   │   │   └── page.tsx         # Booking flow
│   │   └── admin/
│   │       └── settings/
│   │           └── page.tsx     # Admin settings
│   ├── components/
│   │   ├── ServiceCard.tsx      # Service display card
│   │   ├── BookingFlow.tsx      # Multi-step booking
│   │   ├── Receptionist.tsx     # Chat widget
│   │   └── Layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   └── lib/
│       ├── api.ts               # API client
│       └── types.ts             # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Single vs Multi-Barber

### Current (Single Barber)

All bookings default to `NEXT_PUBLIC_DEFAULT_BARBER_SLUG`:
- Services page → Shows your services
- Booking flow → Books with you automatically
- Receptionist → Creates bookings for you

### Future (Multi-Barber)

When you add more barbers:

1. Update services page to show barber filter
2. Add `/barbers` page listing all barbers
3. Support `/barbers/{slug}` individual barber pages
4. Update booking flow to include barber selection
5. Receptionist can route to specific barbers

**No backend changes needed** - the architecture already supports it!

## Deployment

### Environment Variables

Set these in your production environment:

```env
NEXT_PUBLIC_API_URL=https://api.thesignaturechair.com/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=your-production-slug
NEXT_PUBLIC_LOCATION_ID=your_production_location_id
NEXT_PUBLIC_DOMAIN=thesignaturechair.com
```

### Vercel Deployment

```bash
npm run build
# Deploy to Vercel
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Customization

### Branding

Colors defined in `tailwind.config.js`:
```js
colors: {
  primary: {
    600: '#16a34a', // Main brand color
    // ... other shades
  }
}
```

### Business Hours

Update availability logic in booking flow:
```typescript
// src/app/book/page.tsx
const BUSINESS_HOURS = {
  start: 9,  // 9 AM
  end: 18    // 6 PM
};
```

### Receptionist Messages

Customize in `src/components/Receptionist.tsx`:
```typescript
const WELCOME_MESSAGE = "Hi! I'm here to help you book an appointment.";
```

## Troubleshooting

### CORS Errors

Ensure backend `.env` includes:
```env
ALLOWED_ORIGINS=http://localhost:3001,https://thesignaturechair.com
```

### API Not Found

Check `NEXT_PUBLIC_API_URL` in `.env.local` and verify backend is running.

### Barber Not Found

Run barber sync on backend:
```bash
curl -X POST http://localhost:3000/api/barbers/sync-from-square
```

Then update `NEXT_PUBLIC_DEFAULT_BARBER_SLUG`.

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Hot Reload

Next.js automatically reloads on file changes during `npm run dev`.

---

**Built for thesignaturechair.com**
