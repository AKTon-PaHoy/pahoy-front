# Pa·Hoy — Talento local, pa' hoy mismo

Pa·Hoy is a mobile-first platform that connects local talent with clients who need services and products delivered in person. It enables entrepreneurs and independent workers to monetize their skills by prioritizing geographic proximity for service matching.

## Tech Stack

- **React 19** + **TypeScript 5.9** — UI framework with strict typing
- **Vite 8** — Fast dev server and bundler
- **Tailwind CSS 4** — Utility-first styling with custom design tokens
- **React Aria Components** — Accessible, unstyled component primitives
- **React Router 7** — Client-side routing
- **Motion (Framer Motion)** — Page transitions and animations
- **Leaflet + React Leaflet** — Interactive maps for location selection
- **Recharts** — Data charts

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests (Vitest, single run) |

## Project Structure

```
src/
├── components/
│   ├── base/            # Core UI (Button, Input, Select, etc.)
│   └── application/     # Feature components (modals, navigation, maps, chat)
├── hooks/               # Custom React hooks
├── pages/               # Route-level page components
├── providers/           # Context providers (theme, router)
├── styles/              # Global CSS, theme tokens, typography
├── types/               # TypeScript type definitions
├── utils/               # Utilities (API client, auth, coordinates)
└── main.tsx             # App entry point + route definitions
```

## Key Features

- User registration and login (JWT auth)
- Service ("gig") listing, search with distance filter, and detail view
- Gig creation and editing with image upload
- Location selection via interactive Leaflet map
- Real-time chat between talent and clients
- Contract proposal and management lifecycle
- Profile completion with geolocation and reverse geocoding
- Bottom tab navigation (Home, Search, Chambas, Messages, Profile)

## Design

All UI/UX decisions follow the Figma design system:
https://www.figma.com/design/21azV7Zha4GR2qbyTrCOBk/Pa--Hoy---App-Design
