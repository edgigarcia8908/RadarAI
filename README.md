# RadarAI — Inteligencia Pública y de Mercado

Flujo ciudadano, empresa y de veedurías completos con datos **reales** de
SECOP II, siguiendo el mismo estándar de arquitectura que el resto de
`C:\apps` (ver `C:\apps\ARCHITECTURE.md`) — app propia con su propia base
Mongo, 100% autocontenida (ver sección más abajo).

## Estudios de mercado para entidades públicas (`src/estudios-mercado/`)

Cuarto mercado, además de ciudadano/empresa/veeduría: por ley, una entidad
colombiana debe hacer un "estudio de mercado" antes de sacar un proceso —
hoy normalmente a mano. Con la data que RadarAI ya sincroniza, es casi
gratis: `POST /api/estudios-mercado` busca contratos **ya
terminados/cerrados** (no en ejecución, para no comparar contra un precio
que todavía puede cambiar) que coincidan con el objeto + territorio +
sinónimos, y devuelve valor mínimo/máximo/promedio/mediana, duración
promedio de ejecución, proveedores más frecuentes, y la lista de contratos
comparables con link a SECOP. Reusa 100% infraestructura existente
(ingesta, `normalizar()`, `palabrasConSinonimos()`) — no se agregó ningún
dato nuevo. Verificado con datos reales: "mantenimiento" en Cundinamarca
da 39 contratos comparables ($3.6M–$872M, mediana $15M, 122 días promedio,
28 proveedores).

Corrección: sí existe un campo literal de liquidación (`liquidaci_n`, Sí/No)
en el dataset de Contratos Electrónicos — se descubrió después de escribir
esta sección y ahora es la señal principal para el semáforo visual
(`liquidado` en `Contrato`, ver `contratoUtils.ts`). `ESTADOS_TERMINADOS`
sigue como filtro adicional para estudios de mercado.

## Otras fuentes de datos abiertos del Estado (`src/cuipo/`)

Además de SECOP II, el Estado colombiano publica más fuentes reutilizables
sobre el mismo mecanismo (Socrata, `datos.gov.co`) — investigadas a pedido
de un usuario que compartió esta tabla:

| Fuente | Dataset usado | Estado |
| --- | --- | --- |
| **CUIPO** (presupuesto territorial) | `d9mu-h6ar` (programación de gastos) + `4f7r-epif` (ejecución de gastos) | ✅ Integrado |
| **SIRI** (sanciones disciplinarias) | `iaeu-rcn6` | ✅ Integrado — cruza representante legal/ordenador del gasto contra sancionados (coincidencia de nombre, ver sección abajo) |
| **SIGEP II — puestos sensibles a corrupción** | `5u9e-g5w9` | ✅ Integrado — cruza ordenador del gasto/supervisor contra cargos de confianza (informativo, no acusatorio) |
| SIGEP II — servidores en general + declaración de bienes | `h8rs-jxum`, `8tz7-h3eu` | Investigado, pendiente — declaración de bienes se dejó fuera por ahora: el riesgo de atribuirle datos financieros de OTRA persona a alguien por coincidencia de nombre es mayor que con cargo/salario público |
| **SGR** (proyectos de regalías) | `mzgh-shtp` | ✅ Integrado — % ejecución financiera vs. física por proyecto |
| **MDM** (Medición del Desempeño Municipal, reemplazo vigente de TerriData) | `nkjx-rsq7` | ✅ Integrado — TerriData (`64cq-xb2k`) ya no existe (404), este es el índice DNP vigente |
| Cuentas Claras (financiación de campañas) | Solo encontramos `jgra-rz2t` (2019, local) — nada nacional/reciente vía API | Baja prioridad, datos viejos |
| PACO / Contraloría (hallazgos fiscales) | Solo descarga CSV/ZIP directa (sin API), hallazgos fragmentados por contraloría departamental | Requeriría scraper propio, no se hizo |

**CUIPO integrado**: `GET /api/cuipo/presupuesto?departamento=&ciudad=&fechaDesde=&fechaHasta=`
compara el presupuesto apropiado y comprometido de un municipio (CUIPO)
contra lo ya sincronizado de SECOP para el mismo territorio/rango — señala
si el municipio comprometió más del 100% de su presupuesto, o si SECOP
muestra mucho más contratado de lo que CUIPO reporta comprometido. Los
datasets de CUIPO reportan por `periodo` como **corte acumulado del año
fiscal** (no incremental) — sumar varios periodos duplicaría plata, así
que se usa siempre el corte más reciente dentro del rango pedido, nunca una
suma entre periodos. Verificado con datos reales: Tocancipá, Cundinamarca,
corte 01/03/2026 — presupuesto apropiado $1.886.692.503.333, comprometido
$2.055.589.772.662 (109%, alerta automática).

Se muestra en `CiudadanoView` como panel "Presupuesto vs. contratación"
junto a los resultados de cada consulta — si CUIPO no tiene reportes para
esa entidad (nombre no coincide, o no reporta), no rompe el flujo, solo
muestra un mensaje.

## SIRI (sanciones disciplinarias) + perfil cruzado de funcionario

Dos features nuevas sobre la misma idea: cruzar la IDENTIDAD de quien firma
un contrato contra otras fuentes, no solo el territorio.

**SIRI** (`src/siri/`, dataset `iaeu-rcn6`, el mismo que alimenta PACO):
`POST /api/siri/verificar { nombres: string[] }` busca cada nombre en el
registro de sanciones disciplinarias y devuelve coincidencias. El cruce es
por NOMBRE — SECOP no trae cédula del firmante/ordenador del gasto, así
que **nunca se afirma identidad**, solo "coincidencia de nombre a
verificar" (se exige que 3+ palabras del nombre buscado, de 4+ caracteres,
aparezcan en el registro SIRI, para evitar falsos positivos por un solo
apellido común). Se llama automáticamente al cargar resultados en
`CiudadanoView` y `VeeduriasView`, mostrando una alerta roja en
`ContratoCard` cuando hay coincidencia. Verificado con datos reales del
dataset (nombre de prueba con sanción real de 2005).

**Perfil de funcionario** (`CivicIntelService.perfilFuncionario`, `GET
/api/civic-intel/funcionario?nombre=`): a pedido de retroalimentación —
"¿un empleado que ha pasado por varios municipios siempre contrata a los
mismos proveedores?". Busca TODO lo sincronizado (no solo el territorio
consultado) donde la persona aparece como supervisor u ordenador del
gasto, agrupa por municipio y por proveedor, y si el mismo proveedor
aparece en 2+ municipios distintos bajo el mismo funcionario, dispara una
alerta explícita — la huella de una red que sigue al funcionario, no al
municipio. Botón "🔍 Ver historial" bajo demanda en `ContratoCard`
(PerfilFuncionario.tsx), no automático porque implica una consulta
cruzada más pesada. Con un solo municipio sincronizado, hoy solo confirma
el conteo de contratos por persona; el cruce entre municipios se vuelve
útil en cuanto se sincroniza más de un territorio.

## SIGEP II — puestos sensibles a corrupción (`src/sigep/`)

Mismo patrón que SIRI: `POST /api/sigep/verificar { nombres: string[] }`
busca cada nombre (ordenador del gasto / supervisor, es decir servidores
públicos de la entidad, no el proveedor) contra el listado de cargos de
confianza (libre nombramiento y remoción, alto nivel jerárquico) del
dataset `5u9e-g5w9`. A diferencia de SIRI esto **no es una acusación** —
tener un cargo de confianza no es una falta, es contexto público (cargo,
entidad, salario asignado, todos datos que SIGEP publica por ley). Mismo
disclaimer de "coincidencia de nombre, no de identidad verificada" y mismo
umbral de 3+ palabras coincidentes, con badge azul informativo en vez de
rojo de alerta en `ContratoCard`. Verificado con datos reales del dataset.

Se dejó fuera, a propósito, la **declaración de bienes y rentas**
(`8tz7-h3eu`): a diferencia de cargo/salario público, ahí sí hay datos
patrimoniales más sensibles — el riesgo de mostrarle el patrimonio de una
persona equivocada a un ciudadano por una coincidencia de nombre pesa más
que el valor agregado, así que no se integró en esta pasada.

## Contexto territorial: SGR (regalías) + MDM (`src/territorio/`)

`GET /api/territorio/contexto?ciudad=` combina dos fuentes DNP que no
dependen de SECOP:

- **SGR** (`mzgh-shtp`): proyectos financiados con el Sistema General de
  Regalías en el municipio, con **% de ejecución financiera vs. física**
  por proyecto — algo que SECOP no tiene. Si un proyecto está pagado casi
  al 100% pero construido a mitad, se marca como brecha (>30 puntos) y
  dispara alerta — señal clásica de sobrecosto u obra inconclusa.
  Verificado con datos reales: Chalán (Sucre) tiene 24 proyectos activos,
  uno con 71% pagado y solo 48% construido.
- **MDM** (`nkjx-rsq7`, indicador `MDM`): índice DNP 0-100 de qué tan bien
  gestiona el municipio en general — contexto para juzgar si lo que se ve
  en SECOP/CUIPO es consistente con la capacidad de gestión del
  territorio. Es el reemplazo vigente de **TerriData**: el dataset
  original investigado (`64cq-xb2k`) ya no existe (404 al consultarlo).

Nota de matching: el dataset SGR guarda nombres de municipio SIN tildes
("CHALAN"), mientras que SECOP/el resto de la app usa nombres con tildes
("Chalán") — se descubrió al probar y quitar tildes antes de armar el
filtro SoQL (mismo tipo de problema que Bogotá/Cundinamarca, cada fuente
tiene su propia convención de texto).

Se muestra junto al presupuesto CUIPO en `CiudadanoView` como panel
"Contexto territorial" (`ContextoTerritorialCard.tsx`).

## Identidad territorial + Ficha Territorial (`src/divipola/`, `src/ficha-territorial/`)

Fase 0 de la hoja de ruta (ver documento de planeación compartido con el
equipo). Dos piezas:

**DIVIPOLA** (`src/divipola/`, dataset `pqwj-3fi4`, cobertura nacional):
resuelve un municipio contra la llave oficial DANE/IGAC (código DIVIPOLA,
lat/lng). Existe porque cada fuente integrada hasta ahora escribe el
nombre del municipio distinto — van 3 bugs de matching encontrados y
corregidos por eso (Bogotá/Cundinamarca en SECOP, tildes en CUIPO, tildes
en SGR). No reemplaza el matching por nombre que ya usa cada fuente (sería
un refactor mayor), pero es el punto de partida para no repetir el mismo
bug con la próxima fuente.

**Ficha Territorial** (`GET /api/ficha-territorial?departamento=&ciudad=`,
vista `FichaTerritorialView.tsx`): consolida en una sola pantalla lo que
hoy vive repartido entre Vigilar mi territorio, Estudio de mercado y Mapa
de riesgo — identidad DIVIPOLA, resumen de contratación, presupuesto
CUIPO, regalías SGR con su brecha, desempeño MDM, y un resumen de alertas
SIRI/SIGEP. No agrega ninguna fuente nueva, solo reusa los servicios ya
construidos.

Límite importante descubierto al construirla: un municipio con mucho
histórico sincronizado puede tener 500+ nombres de firmantes/ordenadores
distintos, y SIRI/SIGEP no tienen un endpoint "IN" — es una consulta por
nombre. Sin tope, la ficha disparaba cientos de fetch en paralelo y
saturaba la conexión (verificado: 517 nombres reales hicieron fallar
*todas* las consultas). Se limitó a una muestra de 40 nombres, mostrando
siempre cuántos se revisaron sobre el total real — la ficha es un
resumen, no pretende ser exhaustiva; el detalle completo con disclaimer
sigue disponible por contrato en Vigilar mi territorio.

## Repo 100% autocontenido — cero servicios que no podés desplegar vos

Este repo se comparte públicamente (hackathon), así que **nada** de lo que
hace RadarAI depende de un servicio privado que solo el autor puede
levantar. Todo corre en el mismo proceso, con `git clone` + `npm install`:

- **Storage** (`src/storage/`) — antes pegaba a `ceo-storage-service`
  (servicio privado del resto del ecosistema, con una llave de producción
  que ni siquiera el autor tenía guardada localmente — se detectó un 401
  real probándolo). Ahora es disco local dentro del propio proyecto
  (`backend/uploads/`, gitignored) — `LocalStorageService` guarda/sirve
  archivos, sin cuentas ni credenciales de terceros.
- **Lectura de documentos e IA** (`src/lib/pdf.ts`, `src/lib/llm.ts`) —
  antes pegaba a `ceo-intelligence-service` + Qdrant (tampoco desplegado,
  ni verificable en esta máquina). Ahora:
  - El texto del PDF se extrae en el mismo proceso con `pdf-parse` (npm
    público, sin servicio externo).
  - La búsqueda "semántica" sobre esos documentos es por palabras clave
    (mismo criterio que ya usa `oportunidades.service.ts` para matching de
    empresas) — sin base vectorial, sin Qdrant.
  - La redacción con IA es **opcional**: si configurás tu propia
    `ANTHROPIC_API_KEY` u `OPENAI_API_KEY` (APIs públicas estándar,
    cualquiera puede sacar la suya), se llama directo a esa API. Sin
    ninguna de las dos, todo sigue funcionando — con plantillas/fragmentos
    en vez de redacción de IA.
- **Auth** (`src/auth/`) — el único servicio externo real que queda es
  `ceo-auth-service` (`auth.ceoclick.pro`, ya desplegado y público), y
  **ningún endpoint lo exige todavía** — el guard está listo pero no
  aplicado a ninguna ruta, así que no bloquea nada si no lo tocás.
- Los 2 clientes delgados que sí hablan por HTTP con algo externo
  (`src/lib/auth-client.ts`, `src/lib/database.ts` para el fix de DNS de
  Windows) están vendorizados directo en este repo — sin depender de un
  paquete privado.

`npm install` ya no necesita nada fuera de este repo ni de npm público, y
correrlo completo (`npm run dev`) no requiere levantar ningún otro proceso
en paralelo.

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
producto original) — corrección: sí hay una señal directa en el dataset,
`dias_adicionados` (prórroga en días sobre el plazo pactado), ya capturada
en `Contrato.diasAdicionados` y mostrada en `ContratoCard`.

## Cómo correrlo

```bash
npm run install:all
cp backend/.env.example backend/.env   # completar MONGO_URI (Mongo propio de RadarAI)
npm run dev                             # backend :4500 + frontend :5490
```

En el navegador (`http://localhost:5490`): elegí territorio + tema, dale
"Sincronizar datos de SECOP" (trae datos reales, puede tardar unos segundos),
después "Preguntar".

## Cómo funciona la ingesta hoy — preguntas frecuentes

**¿Se actualiza cuando un proceso cambia de estado en SECOP?** Solo si volvés
a sincronizar ese mismo territorio/rango de fechas — cada sync hace `upsert`
por `idProceso`/`idContrato` (pisa el registro con lo último que devuelve
Socrata). **No hay nada automático todavía**: sin cron, un proceso puede
cambiar de estado en SECOP y tu copia queda vieja hasta que alguien apriete
"Sincronizar" de nuevo para ese territorio. Ver punto 3 de "qué falta".

**¿En algún momento tendría copia de todo el país?** No con el diseño
actual. Solo se guarda lo que se sincronizó explícitamente (un
departamento/municipio/rango de fechas a la vez). Para tener el país
completo habría que recorrer los 32 departamentos (y sus ~1100 municipios)
periódicamente — no existe ese job, es trabajo de Fase 2.

**¿Solo trae por búsqueda?** Sí, y con tope de **500 registros por sync**
(los más recientes según el rango de fechas pedido) — sin paginación. Si un
territorio tiene más de 500 procesos en el rango, los que exceden ese tope
no se traen.

**Los estados de SECOP importan y pueden romper la lógica — corregido.**
Verificado a mano contra datos reales: `estado_del_procedimiento` (Borrador/
Publicado/Seleccionado/Evaluación/Aprobado/Cancelado) es el paso del flujo
interno de SECOP, **no** dice si el proceso sigue aceptando ofertas —
"Seleccionado" NO significa "proveedor ya elegido" (fuente de confusión
real: 1015 de 1093 procesos "Seleccionado" en Cundinamarca seguían con
`adjudicado=false`). La señal correcta es un campo separado,
`estado_de_apertura_del_proceso` ('Abierto'/'Cerrado'), que no se estaba
guardando y ya se agregó (`Proceso.estadoApertura`). El motor de
oportunidades (`oportunidades.service.ts`) ahora filtra por
`estadoApertura: 'Abierto'` + excluye `Cancelado`/`Borrador` explícitamente,
en vez de solo `adjudicado: false` (que dejaba pasar falsos positivos).

## Veedurías colaborativas (`src/veedurias/`)

`civika` resultó tener menos armado de lo documentado antes acá (solo
schemas de Jac/Proyecto, sin colaboradores/hallazgos reales) — se construyó
de cero, siguiendo el mismo patrón de módulo que el resto de RadarAI. Modelo:
título/descripción/territorio/tema, `procesosVinculados`/`contratosVinculados`
(ids reales de SECOP, no texto suelto), `hallazgos` y `comentarios`
embebidos, y un `checklist` con los 6 ítems que sugiere el documento de
producto original (Revisar contrato, estudios previos, comparar valor,
modificaciones, ejecución, proveedor). Probado end-to-end en el navegador:
crear → marcar checklist → comentar, con tildes/UTF-8 correctos.

**Sin auth aplicado todavía** — cualquiera puede crear/comentar cualquier
veeduría (`colaboradores` es hoy una lista de emails en texto, no usuarios
reales). Ver punto 4 de "qué falta".

### Documentos de la veeduría — por qué el captcha de SECOP sigue siendo manual

El link `urlproceso` (`community.secop.gov.co`) pide "no soy un robot" antes
de mostrar los documentos del proceso. Se evaluó dejar que un humano resuelva
ese captcha en una sesión y que la app retome sola el scraping de ahí en
adelante — **se descartó a propósito**: el captcha está puesto específicamente
para bloquear acceso automatizado, y automatizar todo lo que sigue después de
que un humano lo pasa es exactamente el patrón de evadir esa protección,
tenga o no la intención de usarlo así.

Lo que sí se construyó (`POST /veedurias/:id/documentos`): el colaborador
consigue el PDF él mismo — pasa el captcha en su propio navegador, lo
descarga, o lo consigue por derecho de petición — y lo sube a la veeduría.
De ahí en adelante todo es automático y **100% local** (ver sección de
arriba):
1. Se guarda en `backend/uploads/` (`LocalStorageService`), servido de
   vuelta por `GET /api/storage/:id`.
2. Si es PDF de texto, se extrae con `pdf-parse` y se trocea
   (`chunkTexto`) en `v.chunksTexto` — sin base vectorial.
3. `POST /veedurias/:id/preguntar` — busca los chunks con más palabras en
   común con la pregunta (mismo criterio de `normalizar()` que el resto del
   proyecto) y, si hay `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` configurada, le
   pide a ese LLM que redacte la respuesta basada solo en esos chunks; si
   no, devuelve los fragmentos tal cual.

Si el parseo falla (PDF corrupto o escaneado sin texto), el archivo se
guarda igual con `indexado:false` y un motivo — nunca rompe la subida.
**Probado de punta a punta en esta sesión**, con `ceo-storage-service`
detenido a propósito para confirmar que ya no hace falta: subida real a
disco local (`GET /api/storage/:id` sirve el archivo, 200 OK), extracción
de texto real de un PDF real (22 chunks), y `/preguntar` devolviendo
fragmentos relevantes con citas — todo sin ningún servicio externo
corriendo.

## Competencia histórica por categoría UNSPSC (ya no es aproximada)

Antes `competenciaHistorica()` contaba proveedores únicos de TODO el
departamento sin filtrar por categoría — daba 'ALTA' para las 12
oportunidades de la prueba con TechCorp SAS, una señal sin poder de
discriminar. Se agregó `Contrato.codigoCategoriaUnspsc` (campo
`codigo_de_categoria_principal` de Socrata, no se estaba guardando) y ahora
se cruza por familia+clase UNSPSC real (primeros 6 dígitos después del
prefijo de versión) + departamento. Resultado verificado: las mismas 12
oportunidades pasaron a 'MEDIA' — más honesto, porque con el volumen actual
de contratos sincronizados (500 por corrida, ver punto 1 de abajo) rara vez
hay suficiente histórico de la misma categoría exacta en la zona para
afirmar 'BAJA' o 'ALTA' con evidencia real. Va a discriminar mejor cuando
haya más volumen ingerido (cron de ingesta, punto 1).

## Qué falta (en orden de impacto)

1. **Cron de ingesta + backfill por país** — hoy `/api/ingestion/sync` es
   manual y por territorio (botón en la app), con tope de 500 por corrida y
   sin paginación. Pasarlo a job programado (BullMQ, mismo patrón que
   `ceo-notifications-service`) recorriendo territorios "vigilados" — es el
   ítem que resuelve las 3 primeras preguntas de la sección de arriba, y el
   que le da más volumen a la competencia por categoría UNSPSC.
2. **Auth real conectado** — el guard existe, no está aplicado a ningún
   endpoint todavía (mismo estado que tenía `ceo-ecosistema` en su Fase 1).
3. **Búsqueda semántica real (embeddings) en vez de por palabras clave** —
   tanto en documentos de veedurías como en matching de empresas, hoy es
   overlap de palabras (`normalizar()`), no vectores. Mejora natural si se
   agrega una API key de embeddings — ninguna base vectorial nueva hace
   falta para eso, se puede resolver en memoria con pocos cientos de chunks.
4. **Chunker semántico** — `chunkTexto()` trocea por caracteres, no por
   oración/párrafo — puede cortar una oración a la mitad. Sirve para
   indexar hoy sin agregar una dependencia nueva.
5. **Configurar Virtualmin** — `deploy.sh` (raíz del repo) ya existe y sube
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
