# RadarAI — Inteligencia Pública y de Mercado

Fase 1 (demo funcional): flujo ciudadano completo con datos **reales** de
SECOP II, siguiendo el mismo estándar de arquitectura que el resto de
`C:\apps` (ver `C:\apps\ARCHITECTURE.md`) — app propia con su propia base
Mongo, consumiendo los servicios centrales del ecosistema por HTTP en vez de
duplicar código.

## Servicios del ecosistema que usa

- **`ceo-auth-service`** (`https://auth.ceoclick.pro/api`, ya desplegado) —
  login/roles. El guard está listo (`src/auth/`) pero **ningún endpoint lo
  exige todavía** — Fase 1 igual que `ceo-ecosistema`, para que la demo no
  dependa de tener sesión.
- **`ceo-storage-service`** (`https://storage.ceoclick.pro/api`, ya
  desplegado) — pensado para cuando un ciudadano suba evidencia a una
  veeduría (Fase 2, todavía no conectado en código).
- **`ceo-intelligence-service`** — **NO está desplegado todavía**. RadarAI lo
  usa para redactar la respuesta en lenguaje natural (`/ai/complete`); si no
  está corriendo o no hay `INTELLIGENCE_SERVICE_KEY`, cae automáticamente a
  una respuesta con plantilla (ver `civic-intel.service.ts` →
  `redactarRespuesta`) — la demo funciona igual, solo con texto más plano.
  Para tenerlo con IA real: `cd C:\apps\ceo-intelligence-service && npm run dev`.

## Fuente de datos: SECOP II real, sin scraping

Dos datasets Socrata de datos.gov.co, consultados en vivo (sin app token
funciona, con rate limit más bajo):

- `p6dx-8zbt` — SECOP II Procesos de Contratación (modalidad, UNSPSC, valor,
  proveedor adjudicado).
- `jbjy-vk9h` — SECOP II Contratos Electrónicos (`objeto_del_contrato`,
  `urlproceso`, valores pagados).

**Decisión importante — documentos del proceso (pliegos, estudios previos,
anexos):** ninguno de los dos datasets trae URL a esos PDFs. El único puente
es `urlproceso`, que apunta a `community.secop.gov.co`, protegida con
ReCaptcha y sin API JSON pública identificable. **No se scrapea** (rompería
ToS y es frágil). En su lugar:
- El AI Engine usa `objeto_del_contrato`/`descripcion_del_proceso` (texto
  libre ya público) para responder qué se compró.
- Cada hallazgo trae un link "ver proceso original en SECOP" (`urlproceso`)
  para que el ciudadano verifique la fuente primaria él mismo.
- Documentos reales quedan como mejora opt-in futura: si alguien consigue un
  PDF por derecho de petición, lo sube a una veeduría y ahí sí se indexa vía
  `ceo-intelligence-service` (`/documents/parse` + `/rag/ingest` — ya
  existen, no hay que construir nada nuevo para eso).

## Cosas de la API de Socrata que costó descubrir (verificadas a mano)

- `urlproceso` viene como **objeto** `{ "url": "..." }`, no como string — si
  lo guardás directo, queda `[object Object]`. Ver `ingestion.service.ts`.
- El campo `ciudad`/`ciudad_entidad` sí viene consistentemente acentuado
  igual al nombre oficial DANE (verificado con Tocancipá: `upper(ciudad) =
  upper('Tocancipá')` da resultados correctos) — filtrar por
  departamento+ciudad directo en Socrata funciona bien y es mucho más preciso
  que traer todo el departamento. Igual guardamos `*Normalizado` (sin
  tildes/mayúsculas) en Mongo como respaldo, porque el objeto contractual
  (`objeto_del_contrato`) sí es inconsistente entre entidades.
- El parámetro `$q` (búsqueda de texto libre) de Socrata es **estricto**:
  con una sola palabra ("mantenimiento") da resultados; con dos palabras
  ("mantenimiento colegios") puede dar 0 aunque haya cientos de contratos que
  las contienen por separado. Por eso `tema` **no** se manda como `$q` — se
  filtra del lado de Mongo contra `textoNormalizado` con un regex OR-de-
  palabras, mucho más permisivo.
- El dataset `jbjy-vk9h` (Contratos Electrónicos, 85 columnas) devuelve
  500/503 con bastante frecuencia sin `SOCRATA_APP_TOKEN` — la misma query
  repetida puede dar 500, luego 503, luego 200 con datos reales, sin cambiar
  nada. `SocrataClient.fetchRows()` reintenta 3 veces con backoff antes de
  fallar. Conseguir un `SOCRATA_APP_TOKEN` (gratis) reduce esto bastante.

## Qué hace el motor cívico hoy (`src/civic-intel/`)

Dado territorio + tema + pregunta, filtra procesos/contratos ya sincronizados
en Mongo y calcula dos hallazgos reales sobre los datos (no simulados):
1. **Concentración de proveedores** — % del valor total que representan los
   2 proveedores más grandes.
2. **Contratos con objeto similar** — agrupa por huella de texto normalizada
   del objeto contractual, señala grupos de 2+ (fraccionamiento potencial).

"Modificaciones posteriores a la adjudicación" (mencionado en el documento de
producto original) **no está implementado** — SECOP II no tiene un dataset
público de adiciones/otrosíes fácilmente enlazable a un contrato; queda
pendiente de investigar como Fase 2.

## Cómo correrlo

```bash
npm run install:all
cp backend/.env.example backend/.env   # completar MONGO_URI (Mongo propio de RadarAI)
npm run dev                             # backend :4500 + frontend :5490
```

En el navegador (`http://localhost:5490`): elegí territorio + tema, dale
"Sincronizar datos de SECOP" (trae datos reales, puede tardar unos segundos),
después "Preguntar".

## Qué falta (en orden de impacto)

1. **Empresas/Oportunidades** — copiar y adaptar `matching.service.ts` de
   `ceo-ecosistema` (Jaccard de tags → luego embeddings vía
   `ceo-intelligence-service`) para el flujo de empresas del documento
   original. No se construyó en esta iteración.
2. **Veedurías colaborativas** — copiar el patrón de `civika` (proyecto +
   colaboradores + hallazgos) en vez de construirlo de cero.
3. **Cron de ingesta** — hoy `/api/ingestion/sync` es manual (botón en la
   demo). Pasarlo a job programado (BullMQ, mismo patrón que
   `ceo-notifications-service`) por territorio "vigilado".
4. **Auth real conectado** — el guard existe, no está aplicado a ningún
   endpoint todavía (mismo estado que tenía `ceo-ecosistema` en su Fase 1).
5. **Chunker semántico para RAG de documentos subidos** — cuando se conecte
   `ceo-storage-service` + subida de PDFs a veedurías, el `/rag/ingest` de
   `ceo-intelligence-service` trocea por caracteres, no por oración — puede
   cortar mal, es una limitación conocida y documentada ahí mismo.
6. **Configurar Virtualmin** — `deploy.sh` (raíz del repo) ya existe y sube
   backend+frontend con PM2, pero el proxy `/api -> :4500` del dominio
   `radar.ceoclick.pro` hay que crearlo a mano en Virtualmin (el script lo
   recuerda al final, no lo puede hacer solo).

## Estado de validación

Probado en vivo en esta sesión, con datos reales: sincronicé Cundinamarca +
Tocancipá contra SECOP y consulté "mantenimiento de colegios" — trajo 11
contratos reales por $3.560.548.081 con 9 proveedores, y detectó los 2
hallazgos (concentración de proveedores 95%, 3 contratos con objeto similar)
con evidencia real y link a SECOP. Repositorio: privado en
`github.com/edgigarcia8908/RadarAI`.

Lo que NO se probó todavía: el flujo completo de `deploy.sh` en el VPS real
(Virtualmin, PM2), ni ningún territorio/tema fuera de Cundinamarca/Tocancipá.
