# RadarAI Architecture Overview

## Stack

- **Frontend**: React + Vite + TypeScript
- **Backend**: NestJS + TypeScript
- **Database**: MongoDB (via Mongoose)
- **Deployment**: Docker Compose

## Project Structure

```
RadarAI/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── radarai/        # Main radar module
│   │   ├── territorio/     # Territory management
│   │   ├── ingesta/        # Data ingestion from Socrata
│   │   ├── civic-intel/    # Civic intelligence
│   │   ├── veedurias-colaborativas/  # Citizen oversight
│   │   ├── ficha-territorial/        # Territory profiles
│   │   ├── empresas/       # Company data
│   │   ├── oportunidades/  # Contract opportunities
│   │   ├── auth/           # Authentication
│   │   ├── analytics/      # Analytics
│   │   ├── ia/             # AI/ML features
│   │   ├── capacidades/    # Capabilities
│   │   ├── intercambio-inteligencia/  # Intelligence exchange
│   │   └── app/            # App module (root)
│   └── package.json
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── pages/          # UI pages
│   │   ├── components/     # Reusable components
│   │   ├── data/           # Data layer
│   │   └── ...
│   └── package.json
├── knowledge/               # Knowledge base (this folder)
└── docker-compose.yml
```

## Data Flow

1. **Ingestion** (`ingesta/`): `SocrataClient` pulls data from datos.gov.co APIs
2. **Processing**: Data is transformed and normalized
3. **Storage**: Stored in MongoDB collections
4. **API**: NestJS endpoints expose data to frontend
5. **Frontend**: React pages consume API, display dashboards

## Key Design Decisions

- All Socrata data extraction is centralized in `ingesta/socrata.client.ts`
- Each data source has a dedicated NestJS module
- Frontend data services in `src/data/` handle API calls
- Real production data from SECOP II, CUIPO, SIRI, SIGEP II, SGR, MDM, DIVIPOLA
