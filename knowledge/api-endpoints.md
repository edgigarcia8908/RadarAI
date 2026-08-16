# API Endpoints

All endpoints are prefixed with `/api/` unless otherwise noted.

## Ingestion

### `POST /api/ingestion/sync`
Sync data from SECOP II to MongoDB.

**Request body:**
```json
{
  "departamento": "Cundinamarca",
  "ciudad": "Tocancipá",
  "fechaDesde": "2024-01-01",
  "fechaHasta": "2024-12-31",
  "tema": "educación"
}
```

**Response:** Sync status with record counts

**Note:** Max 500 records per sync, no pagination

## Analysis

### `POST /api/civic-intel/analizar`
Analyze synced data for findings.

**Request body:**
```json
{
  "territorio": "Cundinamarca",
  "tema": "educación",
  "pregunta": "maintenance of schools"
}
```

**Response:** Findings including supplier concentration, contract similarity groups

## Territory

### `GET /api/territorio/contexto?ciudad=`
Get SGR royalty projects and MDM performance index for a municipality.

**Response:**
```json
{
  "sgr": {
    "proyectos": [...],
    "brechas": [...]  // Execution gaps > 30 percentage points
  },
  "mdm": {
    "indice": 75,
    "descripcion": "..."
  }
}
```

### `GET /api/cuipo/presupuesto?departamento=&ciudad=&fechaDesde=&fechaHasta=`
Compare CUIPO budget against SECOP contracts.

**Response:**
```json
{
  "presupuestoApropiado": 1886692503333,
  "presupuestoComprometido": 2055589772662,
  "porcentaje": 109,
  "alerta": true
}
```

## Verification

### `POST /api/siri/verificar`
Cross-reference names against SIRI disciplinary sanctions.

**Request body:**
```json
{
  "nombres": ["Juan Pérez García", "María López"]
}
```

**Response:** List of name matches with disclaimer

### `POST /api/sigep/verificar`
Cross-reference names against SIGEP trust positions.

**Request body:**
```json
{
  "nombres": ["Juan Pérez García"]
}
```

**Response:** List of position matches (informational, not accusatory)

### `GET /api/divipola/resolver?nombre=`
Resolve municipality name to official DANE code.

**Response:**
```json
{
  "codigo": "25807",
  "nombre": "Tocancipá",
  "departamento": "Cundinamarca",
  "lat": 4.5644,
  "lng": -74.1067
}
```

## Features

### `GET /api/ficha-territorial?departamento=&ciudad=`
Consolidated territory profile (combines all sources).

### `POST /veedurias`
Create a new oversight group.

### `GET /veedurias`
List all oversight groups.

### `POST /veedurias/:id/documentos`
Upload document to an oversight group.

### `POST /veedurias/:id/preguntar`
Ask a question about uploaded documents.

**Request body:**
```json
{
  "pregunta": "What is the total value of the contract?"
}
```

**Response:** Relevant text chunks from documents, optionally with AI-generated answer

### `POST /api/estudios-mercado`
Market price analysis for public entities.

**Request body:**
```json
{
  "objeto": "maintenance",
  "territorio": "Cundinamarca",
  "fechaDesde": "2023-01-01",
  "fechaHasta": "2024-12-31"
}
```

**Response:**
```json
{
  "valorMinimo": 3600000,
  "valorMaximo": 872000000,
  "valorMediana": 15000000,
  "duracionPromedio": 122,
  "proveedores": [...],
  "contratos": [...]
}
```

### `GET /api/storage/:id`
Retrieve a stored file.

## Health

### `GET /api/health`
Health check endpoint.
