<p align="center">
  <img src="docs/logo.png" alt="RadarAI Logo" width="180" />
</p>

<h1 align="center">RadarAI</h1>

<p align="center">
  <strong>Inteligencia Pública y de Mercado para Colombia</strong><br/>
  Transparencia ciudadana, oportunidades para empresas y veedurías colaborativas — con datos reales de SECOP II y fuentes oficiales del Estado.
</p>

---

## ¿Qué es RadarAI?

RadarAI es una plataforma de inteligencia cívica que permite a ciudadanos, empresas y veedurías consultar, analizar y vigilar la contratación pública colombiana. Usa datos **reales** de SECOP II (datos.gov.co) y los cruza con múltiples fuentes oficiales del Estado para detectar anomalías, oportunidades y patrones de riesgo.

### Flujos principales

| Flujo | Descripción |
|-------|-------------|
| **Ciudadano** | Pregunta en lenguaje natural sobre contratación de tu municipio. RadarAI responde con hallazgos reales. |
| **Empresa** | Encuentra oportunidades de contratación abiertas que coincidan con tu perfil. |
| **Veedurías** | Crea una veeduría colaborativa, vincula contratos reales y sube documentos para análisis. |
| **Mapa de Riesgo** | Visualiza alertas de concentración, fraccionamiento y anomalías en un mapa interactivo. |
| **Comparar Proveedores** | Compara historial y comportamiento de proveedores en un territorio. |
| **Ficha Territorial** | Resumen consolidado de un municipio: contratación, presupuesto, regalías, desempeño y alertas. |

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React + TS)              │
│                         localhost:5490                           │
├─────────────────────────────────────────────────────────────────┤
│  HomeView ─── Chat unificado (ciudadano)                        │
│  OportunidadesView ─── Matching empresa ↔ proceso abierto      │
│  CompararProveedoresView ─── Análisis comparativo               │
│  MapaRiesgoView ─── Mapa interactivo (Leaflet)                  │
│  VeeduriasView ─── CRUD + documentos + Q&A                      │
│  FichaTerritorialView ─── Dashboard municipal consolidado       │
│  PersonaView ─── Perfil cruzado de funcionario                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP /api
┌───────────────────────────▼─────────────────────────────────────┐
│                       BACKEND (NestJS + TS)                      │
│                         localhost:4500                           │
├─────────────────────────────────────────────────────────────────┤
│  Módulos:                                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  ingestion   │  │  civic-intel   │  │  chat                │ │
│  │  (SECOP →    │  │  (hallazgos,   │  │  (orquesta prompt →  │ │
│  │   Mongo)     │  │   perfil func) │  │   respuesta)         │ │
│  └──────────────┘  └───────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  cuipo       │  │  siri         │  │  sigep               │ │
│  │  (presupuesto│  │  (sanciones   │  │  (cargos de          │ │
│  │   territorial│  │   discipl.)   │  │   confianza)         │ │
│  └──────────────┘  └───────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  territorio  │  │  veedurias    │  │  oportunidades       │ │
│  │  (SGR + MDM) │  │  (CRUD + docs │  │  (matching empresa)  │ │
│  │              │  │   + Q&A)      │  │                      │ │
│  └──────────────┘  └───────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  estudios-   │  │  ficha-       │  │  situacion           │ │
│  │  mercado     │  │  territorial  │  │  (actualidad Socrata │ │
│  │              │  │              │  │   en vivo)           │ │
│  └──────────────┘  └───────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  divipola    │  │  storage      │  │  empresas            │ │
│  │  (identidad  │  │  (archivos    │  │  (perfil proveedor)  │ │
│  │   municipal) │  │   local)      │  │                      │ │
│  └──────────────┘  └───────────────┘  └──────────────────────┘ │
│  ┌──────────────┐                                               │
│  │  auth        │  (guard listo, no aplicado aún)               │
│  └──────────────┘                                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                     FUENTES DE DATOS                             │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB (local)          ← Procesos + Contratos sincronizados  │
│  datos.gov.co / Socrata   ← SECOP II, CUIPO, SIRI, SIGEP,      │
│                              SGR, MDM, DIVIPOLA                 │
│  Disco local (uploads/)   ← Documentos de veedurías            │
│  LLM (opcional)           ← Anthropic / OpenAI API key          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura del proyecto

```
RadarAI/
├── backend/                    # API NestJS (TypeScript)
│   ├── src/
│   │   ├── auth/               # Guard JWT (listo, sin aplicar)
│   │   ├── chat/               # Orquestación: prompt → respuesta
│   │   ├── civic-intel/        # Motor de hallazgos (concentración, fraccionamiento)
│   │   ├── common/             # Normalización, sinónimos, formateo
│   │   ├── cuipo/              # Presupuesto territorial (CUIPO)
│   │   ├── divipola/           # Identidad municipal DANE
│   │   ├── empresas/           # Perfil de proveedor/empresa
│   │   ├── estudios-mercado/   # Estudio de mercado automatizado
│   │   ├── ficha-territorial/  # Dashboard consolidado por municipio
│   │   ├── ingestion/          # Sincronización SECOP → Mongo
│   │   ├── lib/                # PDF, LLM, auth-client, chunks
│   │   ├── oportunidades/      # Matching empresa ↔ proceso abierto
│   │   ├── sigep/              # Cargos de confianza (SIGEP II)
│   │   ├── siri/               # Sanciones disciplinarias (SIRI)
│   │   ├── situacion/          # Consultas en vivo a Socrata
│   │   ├── storage/            # Almacenamiento local de archivos
│   │   ├── territorio/         # SGR (regalías) + MDM (desempeño)
│   │   └── veedurias/          # CRUD veedurías + documentos + Q&A
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # SPA React + Vite (TypeScript)
│   ├── public/
│   │   ├── logo.png            # Logo de la aplicación
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── home/           # Vista principal + chat
│   │   │   ├── navigation/     # Shell de vistas secundarias
│   │   │   ├── compare/        # Comparar proveedores
│   │   │   ├── map/            # Mapa de riesgo (Leaflet)
│   │   │   ├── opportunities/  # Oportunidades para empresas
│   │   │   └── person/         # Perfil de persona
│   │   ├── services/           # Llamadas API
│   │   ├── constants/          # Configuración UI
│   │   ├── types/              # Interfaces TypeScript
│   │   ├── App.tsx             # Router por estado (sin react-router)
│   │   ├── index.css           # Estilos globales
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── logo.png               # Logo para documentación
├── deploy.sh                   # Script de despliegue (PM2)
├── package.json                # Scripts raíz (install:all, dev)
└── README.md
```

---

## Fuentes de datos integradas

| Fuente | Dataset Socrata | Qué aporta |
|--------|----------------|------------|
| **SECOP II — Procesos** | `p6dx-8zbt` | Modalidad, UNSPSC, valor, proveedor adjudicado |
| **SECOP II — Contratos** | `jbjy-vk9h` | Objeto contractual, valores pagados, URL proceso |
| **CUIPO** | `d9mu-h6ar` + `4f7r-epif` | Presupuesto apropiado vs. comprometido |
| **SIRI** | `iaeu-rcn6` | Sanciones disciplinarias (cruce por nombre) |
| **SIGEP II** | `5u9e-g5w9` | Cargos de confianza / libre nombramiento |
| **SGR** | `mzgh-shtp` | Proyectos de regalías (ejecución financiera vs. física) |
| **MDM** | `nkjx-rsq7` | Índice de desempeño municipal (DNP) |
| **DIVIPOLA** | `pqwj-3fi4` | Código DANE, coordenadas, identidad oficial |

Todas se consultan vía API Socrata en vivo — sin scraping, sin app token obligatorio (funciona con rate limit más bajo).

---

## Hallazgos que detecta automáticamente

1. **Concentración de proveedores** — % del valor total que acumulan los 2 mayores proveedores.
2. **Fraccionamiento potencial** — Contratos con objeto textual similar agrupados.
3. **Sobre-ejecución presupuestal** — CUIPO comprometido > apropiado (>100%).
4. **Discrepancia SECOP vs. CUIPO** — Lo contratado en SECOP excede lo reportado en CUIPO.
5. **Brecha ejecución SGR** — Pagado >>% vs. construido (sobrecosto potencial).
6. **Sanciones SIRI** — Coincidencia de nombre del firmante con sancionados.
7. **Cargo de confianza SIGEP** — Firmante ocupa cargo de libre nombramiento (contexto).
8. **Red que sigue al funcionario** — Mismo proveedor aparece con el mismo funcionario en 2+ municipios.
9. **Prórrogas** — `dias_adicionados` sobre el plazo original.

---

## Cómo correr el proyecto

### Requisitos

- Node.js 18+
- MongoDB (local o Atlas)
- (Opcional) `ANTHROPIC_API_KEY` o `OPENAI_API_KEY` para redacción con IA
- (Opcional) `SOCRATA_APP_TOKEN` para reducir errores 500/503

### Instalación

```bash
git clone https://github.com/edgigarcia8908/RadarAI.git
cd RadarAI
npm run install:all
```

### Configuración

```bash
cp backend/.env.example backend/.env
# Editar backend/.env con tu MONGO_URI y opcionalmente las API keys
```

### Ejecutar en desarrollo

```bash
npm run dev
# Backend: http://localhost:4500
# Frontend: http://localhost:5490
```

### Build de producción

```bash
cd frontend && npm run build    # genera frontend/dist/
```

---

## API — Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ingestion/sync` | Sincroniza SECOP para un territorio |
| POST | `/api/chat` | Chat unificado (ciudadano) |
| GET | `/api/civic-intel/analizar` | Motor de hallazgos cívicos |
| GET | `/api/civic-intel/funcionario` | Perfil cruzado de funcionario |
| GET | `/api/oportunidades` | Oportunidades abiertas para empresa |
| POST | `/api/estudios-mercado` | Estudio de mercado automatizado |
| GET | `/api/cuipo/presupuesto` | Presupuesto territorial |
| POST | `/api/siri/verificar` | Verificación sanciones SIRI |
| POST | `/api/sigep/verificar` | Verificación cargos SIGEP |
| GET | `/api/territorio/contexto` | Regalías + desempeño municipal |
| GET | `/api/ficha-territorial` | Ficha consolidada |
| GET | `/api/veedurias` | CRUD veedurías |
| POST | `/api/veedurias/:id/documentos` | Subir documento a veeduría |
| POST | `/api/veedurias/:id/preguntar` | Q&A sobre documentos |
| GET | `/api/situacion/pregunta` | Consulta en vivo a Socrata |

---

## 100% autocontenido — sin servicios privados

Todo corre con `git clone` + `npm install`:

- **Storage**: disco local (`backend/uploads/`), sin servicios externos.
- **PDF**: extracción con `pdf-parse` en el mismo proceso.
- **IA**: opcional (Anthropic/OpenAI API key pública). Sin key, usa plantillas/fragmentos.
- **Auth**: guard listo pero no aplicado — nada se bloquea sin él.
- **Búsqueda**: por palabras clave (`normalizar()`), sin base vectorial.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, TypeScript, Vite, Leaflet |
| Backend | NestJS, TypeScript, Mongoose |
| Base de datos | MongoDB |
| Datos abiertos | Socrata (datos.gov.co) |
| IA (opcional) | Anthropic Claude / OpenAI GPT |
| Deploy | PM2 + Virtualmin |

---

## Qué falta (roadmap)

1. **Cron de ingesta + backfill por país** — Job programado para sincronizar territorios vigilados automáticamente.
2. **Auth real** — Conectar el guard existente a endpoints.
3. **Búsqueda semántica** — Embeddings en vez de overlap de palabras.
4. **Chunker semántico** — Trocear por oración/párrafo en vez de caracteres.
5. **Deploy completo** — Proxy Virtualmin para `radar.ceoclick.pro`.

---

## Demo

El proyecto fue validado con datos reales: Cundinamarca + Tocancipá contra SECOP — "mantenimiento de colegios" trajo 11 contratos reales por $3.560.548.081 con 9 proveedores, detectando concentración (95%) y fraccionamiento (3 objetos similares).

---

## Licencia

Uso privado — repositorio de hackathon.
