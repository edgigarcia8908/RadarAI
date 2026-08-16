# Data Sources

All data comes from `datos.gov.co` via the Socrata Open Data API (SODA). No app token required (but one reduces rate limit failures).

## SECOP II (Colombian Public Procurement)

### Processes (`p6dx-8zbt`)
- **Content**: Contracting processes - modality, UNSPSC code, value, awarded supplier
- **Key fields**: `id_proceso`, `modalidad_de_contratacion`, `nombre_del_proceso`, `estado_del_procedimiento`, `estado_de_apertura_del_proceso`, `adjudicado`, `valor_total_adjudicado`, `proveedor_adjudicado`
- **Filtering**: By `departamento_entidad`, `ciudad_entidad`, `fecha_de_publicacion_del_proceso`
- **Rate limit**: ~500 records per query, 500/503 errors common without token

### Contracts (`jbjy-vk9h`)
- **Content**: Electronic contracts - object, payments, execution
- **Key fields**: `id_contrato`, `objeto_del_contrato`, `valor_del_contrato`, `valor_pagado`, `dias_adicionados`, `liquidaci_n` (Sí/No)
- **Special handling**: `urlproceso` comes as JSON object `{ "url": "..." }`, must be parsed
- **Rate limit**: More frequent 500/503 errors than processes dataset

## CUIPO (Territorial Budget)

### Two datasets:
- `d9mu-h6ar` - Budget programming (apropiación)
- `4f7r-epif` - Budget execution (compromiso)

### Important behavior:
- Data is **cumulative by fiscal year period** (not incremental)
- Never sum multiple periods - use only the most recent period in the requested range
- Endpoint: `GET /api/cuipo/presupuesto?departamento=&ciudad=&fechaDesde=&fechaHasta=`

## SIRI (Disciplinary Sanctions)

- **Dataset**: `iaeu-rcn6`
- **Endpoint**: `POST /api/siri/verificar { nombres: string[] }`
- **Matching**: Name-based (3+ words of 4+ characters required to match)
- **Display**: Red alert badge on contract cards
- **Disclaimer**: "Name match, not verified identity"

## SIGEP II (Corruption-Sensitive Positions)

- **Dataset**: `5u9e-g5w9` - Trust positions (free appointment/removal)
- **Endpoint**: `POST /api/sigep/verificar { nombres: string[] }`
- **Matching**: Same 3+ word threshold as SIRI
- **Display**: Blue informational badge (not accusatory)
- **Note**: Does NOT include asset declarations (intentionally excluded due to false positive risk)

## SGR (Royalty Projects)

- **Dataset**: `mzgh-shtp`
- **Endpoint**: `GET /api/territorio/contexto?ciudad=`
- **Key metric**: Financial execution % vs. physical execution % per project
- **Alert**: If gap > 30 percentage points (paid nearly complete, built halfway)

## MDM (Municipal Performance Index)

- **Dataset**: `nkjx-rsq7`
- **Endpoint**: `GET /api/territorio/contexto?ciudad=`
- **Value**: 0-100 DNP index measuring overall municipal management capacity
- **Replacement**: TerriData (`64cq-xb2k`) no longer exists (404)

## DIVIPOLA (Territory Codes)

- **Dataset**: `pqwj-3fi4`
- **Endpoint**: `GET /api/divipola/resolver?nombre=`
- **Purpose**: Resolves municipality name to official DANE/IGAC code + lat/lng
- **Why needed**: Different sources spell municipality names differently (accents, Bogotá/Cundinamarca)
