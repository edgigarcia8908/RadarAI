# RadarAI Knowledge Base

## Overview

RadarAI is a public intelligence and market platform for Colombian public procurement. It provides real-time data from SECOP II (Colombian public procurement system) and multiple government data sources, enabling citizens, companies, and oversight bodies (veedurías) to monitor, analyze, and participate in public contracting.

## Architecture

- **Backend**: NestJS (TypeScript) with MongoDB
- **Frontend**: React + Vite + TypeScript
- **Data Sources**: 7+ government open data APIs via Socrata (datos.gov.co)
- **Deployment**: Single process, no external services required

## Key Concepts

- **Territory-based queries**: Users select a Colombian municipality/department and a topic (e.g., "education", "health")
- **Real data ingestion**: On-demand sync from SECOP II datasets via Socrata API
- **Civic intelligence engine**: Analyzes supplier concentration, contract similarity, and flags potential irregularities
- **Cross-referencing**: Automatically checks names against disciplinary sanctions (SIRI) and corruption-sensitive positions (SIGEP II)

## Data Sources

| Source | Dataset ID | Purpose |
|--------|-----------|---------|
| SECOP II - Processes | `p6dx-8zbt` | Contracting processes (modality, value, supplier) |
| SECOP II - Contracts | `jbjy-vk9h` | Electronic contracts (object, payments) |
| CUIPO - Budget | `d9mu-h6ar` + `4f7r-epif` | Territorial budget vs. actual spending |
| SIRI | `iaeu-rcn6` | Disciplinary sanctions registry |
| SIGEP II | `5u9e-g5w9` | Corruption-sensitive positions |
| SGR | `mzgh-shtp` | Royalty-funded projects |
| MDM | `nkjx-rsq7` | Municipal performance index |
| DIVIPOLA | `pqwj-3fi4` | Official territory codes |

## Related Documentation

- [Architecture](architecture.md) - Detailed backend/frontend structure
- [Data Sources](data-sources.md) - All integrated government APIs
- [Backend Modules](backend-modules.md) - Each NestJS module explained
- [Frontend](frontend.md) - React UI components and pages
- [API Endpoints](api-endpoints.md) - All REST endpoints
