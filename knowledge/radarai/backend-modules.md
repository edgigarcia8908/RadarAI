# RadarAI Backend Modules

NestJS backend with 15+ modules, each handling a specific domain.

## Module Overview

| Module | Purpose | Key Files |
|--------|---------|-----------|
| `radarai` | Main radar module, orchestrates data display | `radarai.module.ts`, `radarai.controller.ts`, `radarai.service.ts` |
| `territorio` | Territory management and geographic data | `territorio.module.ts`, `territorio.controller.ts`, `territorio.service.ts` |
| `ingesta` | Data ingestion from all Socrata sources | `ingesta.module.ts`, `socrata.client.ts`, `ingestion.service.ts` |
| `civic-intel` | Civic intelligence and analysis | `civic-intel.module.ts`, `civic-intel.controller.ts`, `civic-intel.service.ts` |
| `veedurias-colaborativas` | Citizen oversight and participation | `veedurias-colaborativas.module.ts`, `veedurias-colaborativas.controller.ts` |
| `ficha-territorial` | Detailed territory profiles | `ficha-territorial.module.ts`, `ficha-territorial.controller.ts` |
| `empresas` | Company/enterprise data | `empresas.module.ts`, `empresas.controller.ts`, `empresas.service.ts` |
| `oportunidades` | Contract opportunities discovery | `oportunidades.module.ts`, `oportunidades.controller.ts`, `oportunidades.service.ts` |
| `auth` | Authentication and authorization | `auth.module.ts`, `auth.controller.ts`, `auth.service.ts` |
| `analytics` | Usage analytics and reporting | `analytics.module.ts`, `analytics.controller.ts`, `analytics.service.ts` |
| `ia` | AI/ML features and predictions | `ia.module.ts`, `ia.controller.ts`, `ia.service.ts` |
| `capacidades` | System capabilities documentation | `capacidades.module.ts`, `capacidades.controller.ts` |
| `intercambio-inteligencia` | Intelligence exchange between modules | `intercambio-inteligencia.module.ts`, `intercambio-inteligencia.controller.ts` |
| `app` | Root application module, wires everything | `app.module.ts`, `app.controller.ts`, `app.service.ts` |

## Key Module Details

### ingesta (Data Ingestion)
- **SocrataClient**: Core client for all Socrata API calls
  - Handles authentication, rate limiting, pagination
  - Methods: `fetchDataset()`, `fetchWithFilters()`, `fetchAll()`
- **IngestionService**: Orchestrates periodic data pulls
  - Schedules ingestion jobs
  - Tracks ingestion status and errors

### radarai (Main Module)
- Primary controller for dashboard display
- Aggregates data from multiple sources
- Provides search, filter, and aggregation endpoints

### auth
- JWT-based authentication
- Role-based access control
- API key management for external integrations

## Data Flow Between Modules

```
ingesta → radarai → frontend
  ↓         ↓
territorio → ficha-territorial
  ↓
empresas
  ↓
oportunidades
```
