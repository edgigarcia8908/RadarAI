# Backend Modules

## Core Modules

### `ingestion` (Ingesta)
- **Files**: `ingestion.service.ts`, `socrata.client.ts`, `ingestion.controller.ts`
- **Purpose**: Sync data from SECOP II Socrata API to MongoDB
- **Key class**: `SocrataClient` - handles API calls with retry (3 attempts, backoff)
- **Key class**: `IngestionService` - orchestrates sync, normalization, upsert
- **Normalization**: Strips accents, lowercases, stores as `*Normalizado` fields
- **Endpoint**: `POST /api/ingestion/sync { departamento, ciudad, fechaDesde, fechaHasta, tema }`
- **Limit**: 500 records per sync, no pagination

### `civic-intel` (Civic Intelligence)
- **Files**: `civic-intel.service.ts`, `civic-intel.controller.ts`
- **Purpose**: Analyze synced data for findings
- **Analysis 1**: Supplier concentration (% of total value from top 2 suppliers)
- **Analysis 2**: Contract similarity (groups of 2+ contracts with similar objects → potential splitting)
- **Endpoint**: `POST /api/civic-intel/analizar { territorio, tema, pregunta }`

### `territorio` (Territory Context)
- **Files**: `territorio.service.ts`, `territorio.controller.ts`
- **Purpose**: Combine SGR (royalties) + MDM (performance) data
- **Endpoint**: `GET /api/territorio/contexto?ciudad=`
- **Alert**: SGR execution gap > 30 percentage points

### `cuipo` (Budget)
- **Files**: `cuipo.service.ts`, `cuipo.controller.ts`
- **Purpose**: Compare CUIPO budget data against SECOP contracts
- **Endpoint**: `GET /api/cuipo/presupuesto?departamento=&ciudad=&fechaDesde=&fechaHasta=`
- **Alert**: If budget commitment > 100% of appropriation

## Verification Modules

### `siri` (Disciplinary Sanctions)
- **Files**: `siri.service.ts`, `siri.controller.ts`
- **Purpose**: Cross-reference names against SIRI sanctions registry
- **Endpoint**: `POST /api/siri/verificar { nombres: string[] }`
- **Matching**: 3+ words of 4+ characters must appear in SIRI record

### `sigep` (Corruption Positions)
- **Files**: `sigep.service.ts`, `sigep.controller.ts`
- **Purpose**: Cross-reference names against SIGEP trust positions
- **Endpoint**: `POST /api/sigep/verificar { nombres: string[] }`
- **Note**: Informational only, not accusatory

### `divipola` (Territory Resolution)
- **Files**: `divipola.service.ts`, `divipola.controller.ts`
- **Purpose**: Resolve municipality name to official DANE code
- **Endpoint**: `GET /api/divipola/resolver?nombre=`

## Feature Modules

### `ficha-territorial` (Territory Profile)
- **Files**: `ficha-territorial.service.ts`, `ficha-territorial.controller.ts`
- **Purpose**: Consolidate all territory data into single view
- **Endpoint**: `GET /api/ficha-territorial?departamento=&ciudad=`
- **Limit**: Samples 40 names max for SIRI/SIGEP cross-checks

### `veedurias` (Collaborative Oversight)
- **Files**: `veedurias.service.ts`, `veedurias.controller.ts`
- **Purpose**: Community oversight of contracts
- **Features**: Create veeduria, link contracts, add findings, upload documents
- **Document handling**: Local storage, PDF text extraction, keyword search Q&A
- **Endpoint**: `POST /veedurias/:id/preguntar { pregunta }`

### `oportunidades` (Business Opportunities)
- **Files**: `oportunidades.service.ts`, `oportunidades.controller.ts`
- **Purpose**: Find open contracting opportunities for companies
- **Filtering**: `estadoApertura: 'Abierto'`, exclude `Cancelado`/`Borrador`
- **Competition level**: Based on UNSPSC category + department

### `empresas` (Company Profiles)
- **Files**: `empresas.service.ts`, `empresas.controller.ts`
- **Purpose**: Company profiles and contract history

### `estudios-mercado` (Market Studies)
- **Files**: `estudios-mercado.service.ts`, `estudios-mercado.controller.ts`
- **Purpose**: Market price analysis for public entities (legal requirement)
- **Endpoint**: `POST /api/estudios-mercado { objeto, territorio, fechaDesde, fechaHasta }`
- **Returns**: Min/max/avg/median price, avg duration, top suppliers

## Support Modules

### `storage` (File Storage)
- **Files**: `storage.service.ts`, `storage.controller.ts`
- **Purpose**: Local disk file storage (replaced external `ceo-storage-service`)
- **Location**: `backend/uploads/`
- **Endpoint**: `GET /api/storage/:id`

### `auth` (Authentication)
- **Files**: `auth.service.ts`, `auth.guard.ts`, `auth.controller.ts`
- **Purpose**: JWT authentication (prepared, not applied to any endpoint yet)
- **External**: Connects to `ceo-auth-service` (`auth.ceoclick.pro`)

### `lib` (Shared Utilities)
- **`pdf.ts`**: PDF text extraction via `pdf-parse`
- **`llm.ts`**: Optional AI text generation (requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`)
- **`database.ts`**: MongoDB connection with DNS fix for Windows
- **`auth-client.ts`**: Auth service HTTP client (vendored)
