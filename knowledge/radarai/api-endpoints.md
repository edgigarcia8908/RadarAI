# RadarAI API Endpoints

NestJS backend exposes RESTful API endpoints.

## Base URL

- Development: `http://localhost:3000`
- Production: Configured via environment variables

## Core Endpoints

### Radar
- `GET /api/radar` — Get radar overview data
- `GET /api/radar/search` — Search across all data sources
- `GET /api/radar/stats` — Aggregate statistics

### Territory
- `GET /api/territorio` — List all territories
- `GET /api/territorio/:id` — Get territory details
- `GET /api/territorio/:id/ficha` — Get territory profile

### Companies
- `GET /api/empresas` — List companies
- `GET /api/empresas/:id` — Get company details

### Opportunities
- `GET /api/oportunidades` — List contract opportunities
- `GET /api/oportunidades/:id` — Get opportunity details
- `GET /api/oportunidades/search` — Search opportunities

### Civic Intelligence
- `GET /api/civic-intel` — Get civic intelligence data
- `GET /api/civic-intel/analysis` — Get analysis results

### Veedurías (Oversight)
- `GET /api/veedurias` — List oversight records
- `GET /api/veedurias/:id` — Get oversight details

### Analytics
- `GET /api/analytics/usage` — Usage statistics
- `GET /api/analytics/trends` — Trend data

## Authentication

- JWT Bearer token in `Authorization` header
- API key in `X-API-Key` header (for external integrations)

## Data Format

All responses are JSON with standard envelope:
```json
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20 },
  "timestamp": "2024-01-01T00:00:00Z"
}
```
