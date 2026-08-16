# RadarAI Data Sources

All data is sourced from Colombia's open data portal (datos.gov.co) via the Socrata API.

## Primary Sources

| Source | Dataset IDs | Description |
|--------|------------|-------------|
| SECOP II (Contracts) | `p6dx-8zbt`, `jbjy-vk9h` | Public contracting data |
| CUIPO | `d9mu-h6ar`, `4f7r-epif` | Unified environmental information |
| SIRI | `iaeu-rcn6` | Environmental supervision records |
| SIGEP II | `5u9e-g5w9` | Public procurement system |
| SGR | `mzgh-shtp` | General regime of contributions |
| MDM | `nkjx-rsq7` | Municipal development index |
| DIVIPOLA | `pqwj-3fi4` | Geographic divisions |

## API Access Pattern

All sources use the Socrata Open Data API (SODA):
```
https://www.datos.gov.co/resource/{dataset_id}.json
```

Common query parameters:
- `$limit` — max records (default 1000)
- `$offset` — pagination offset
- `$where` — SQL-like filters
- `$order` — sort order
- `$select` — column selection

## Key Fields

### SECOP II Contracts
- `numero_contrato` — contract number
- `entidad` — contracting entity
- `valor_total` — total contract value
- `fecha_firma` — signature date
- `estado` — contract status
- `tipo_contrato` — contract type

### DIVIPOLA
- `codigo_divipola` — geographic code
- `departamento` — department
- `municipio` — municipality
- `latitud` / `longitud` — coordinates

## Gotchas

- API rate limits apply; use pagination
- Some datasets have inconsistent field naming
- Date formats vary across sources
- Municipality names may not match exactly across datasets
