# Frontend

## Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)

## Pages

### `Radar/RadarPage.tsx` - Main Radar UI
- Territory selection (department/municipality dropdowns)
- Topic selection (education, health, infrastructure, etc.)
- "Sync SECOP Data" button triggers ingestion
- "Ask" button triggers analysis
- Displays contract cards with findings

### `CiudadanoView/CiudadanoView.tsx` - Citizen View
- Search by territory + topic
- Budget vs. contracting panel (CUIPO data)
- Territory context panel (SGR royalties + MDM performance)
- SIRI/SIGEP alerts on contract cards
- Links to original SECOP processes

### `EmpresaView/EmpresaView.tsx` - Company View
- Business opportunity finder
- Competition level indicators (based on UNSPSC category)
- Open contract opportunities list

### `VeeduriasView/VeeduriasView.tsx` - Oversight View
- Create/manage oversight groups (veedurías)
- Link contracts to veedurías
- Upload documents (PDFs)
- Ask questions about uploaded documents
- Checklist for contract review process

### `FichaTerritorial/FichaTerritorialView.tsx` - Territory Profile
- Consolidated territory view
- DIVIPOLA code resolution
- Contracting summary
- Budget data (CUIPO)
- Royalty projects (SGR) with execution gaps
- Performance index (MDM)
- SIRI/SIGEP summary (sampled 40 names max)

## Key Components

### `ContratoCard/ContratoCard.tsx`
- Displays individual contract with key metrics
- Shows SIRI alert (red) if name match found
- Shows SIGEP badge (blue) if trust position match found
- "View History" button for cross-municipal supplier tracking

### `ContextoTerritorialCard.tsx`
- SGR royalty projects with execution gaps
- MDM performance index

### `PerfilFuncionario/PerfilFuncionario.tsx`
- Functionary profile across municipalities
- Supplier tracking across different territories
- Alert if same supplier appears under same functionary in 2+ municipalities

## Data Layer (`src/data/`)

### `radarData.ts`
- API client functions for all endpoints
- Handles CORS, error responses
- Formats data for UI consumption
