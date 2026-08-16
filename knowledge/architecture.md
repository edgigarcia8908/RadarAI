# Architecture

## Stack

- **Backend**: NestJS (TypeScript) with MongoDB via Mongoose
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Database**: MongoDB (local, user-managed)
- **Process Manager**: PM2 (for deployment)
- **Package Manager**: npm workspaces (root), pnpm (for global tools)

## Project Structure

```
RadarAI/
├── backend/
│   ├── src/
│   │   ├── app.module.ts          # Main NestJS module wiring
│   │   ├── main.ts                # Bootstrap + CORS config
│   │   ├── env.ts                 # Environment variable loading
│   │   ├── ingestion/             # SECOP II data sync
│   │   ├── civic-intel/           # Intelligence engine
│   │   ├── territorio/            # SGR + MDM context
│   │   ├── cuipo/                 # Budget comparison
│   │   ├── siri/                  # Disciplinary sanctions
│   │   ├── sigep/                 # Corruption-sensitive positions
│   │   ├── divipola/              # Territory code resolution
│   │   ├── ficha-territorial/     # Consolidated territory view
│   │   ├── veedurias/             # Collaborative oversight
│   │   ├── oportunidades/         # Business opportunities
│   │   ├── empresas/              # Company profiles
│   │   ├── estudios-mercado/      # Market studies for entities
│   │   ├── auth/                  # Authentication (prepared, not applied)
│   │   ├── lib/                   # Shared utilities (PDF, LLM, DB)
│   │   ├── storage/               # Local file storage
│   │   └── common/                # Shared DTOs, pipes, filters
│   ├── uploads/                   # Local file storage (gitignored)
│   ├── .env.example               # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Route components
│   │   │   ├── Radar/             # Main radar UI
│   │   │   ├── CiudadanoView/     # Citizen-facing view
│   │   │   ├── EmpresaView/       # Company-facing view
│   │   │   ├── VeeduriasView/     # Oversight view
│   │   │   └── FichaTerritorial/  # Territory profile
│   │   ├── components/            # Shared UI components
│   │   ├── data/                  # API client functions
│   │   └── App.tsx                # Router setup
│   └── package.json
├── knowledge/                     # This knowledge base
├── package.json                   # Root workspace config
└── README.md                      # Main project docs
```

## Data Flow

1. User selects territory (municipality/department) + topic
2. Frontend calls `POST /api/ingestion/sync` with parameters
3. Backend fetches from SECOP II Socrata API (up to 500 records per sync)
4. Data normalized and stored in MongoDB (upsert by `idProceso`/`idContrato`)
5. User clicks "Ask" → frontend calls `POST /api/civic-intel/analizar`
6. Backend queries MongoDB, runs intelligence algorithms, returns findings
7. Cross-references names against SIRI and SIGEP II automatically
8. Results displayed with SECOP source links for verification

## Key Design Decisions

- **No external services required**: Everything runs in one process. Storage is local disk, PDF extraction uses `pdf-parse`, keyword search replaces vector embeddings.
- **On-demand sync**: No cron jobs. Users trigger sync manually per territory/date range. Keeps scope controlled.
- **Name-based cross-referencing**: SECOP doesn't provide cedula (ID number), so all cross-checks use fuzzy name matching (3+ word threshold) with explicit "not verified identity" disclaimers.
- **Upsert pattern**: Each sync overwrites previous data for same territory/date range, ensuring freshest data wins.
