# RadarAI Frontend

React + Vite + TypeScript frontend for the RadarAI platform.

## Tech Stack

- React 18
- Vite (build tool)
- TypeScript
- React Router (routing)
- Tailwind CSS (styling)
- Recharts / Chart.js (data visualization)

## Project Structure

```
frontend/src/
├── pages/           # Route-level components
│   ├── Radar/       # Main radar dashboard
│   ├── Dashboard/   # Analytics dashboard
│   ├── Territorio/  # Territory views
│   ├── Empresas/    # Company listings
│   └── ...
├── components/      # Reusable UI components
├── data/            # API client and data services
│   ├── radarData.ts # Main data fetching logic
│   └── ...
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Root component, routing
└── main.tsx         # Entry point
```

## Data Layer

- `data/radarData.ts` — primary API client for radar data
- Fetches from NestJS backend endpoints
- Handles caching, loading states, error handling

## Key Pages

- **RadarPage**: Main dashboard with interactive map and charts
- **DashboardPage**: Analytics and reporting
- **TerritorioPage**: Geographic territory exploration
- **EmpresasPage**: Company directory and profiles
- **OportunidadesPage**: Contract opportunity discovery

## Component Patterns

- Container/presentational pattern
- Shared components in `components/`
- Page-specific components co-located with pages
