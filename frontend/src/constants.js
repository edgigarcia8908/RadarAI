export const VIEWS = {
  HOME: 'home',
  CITIZEN: 'citizen',
  BUSINESS: 'business',
  OVERSIGHT: 'oversight',
  RISK_MAP: 'risk-map',
  MARKET: 'market',
};

export const NAV_ITEMS = [
  { id: VIEWS.HOME, label: 'Inicio' },
  { id: VIEWS.CITIZEN, label: 'Ciudadania' },
  { id: VIEWS.BUSINESS, label: 'Empresas' },
  { id: VIEWS.OVERSIGHT, label: 'Veedurias' },
  { id: VIEWS.RISK_MAP, label: 'Mapa de riesgo' },
  { id: VIEWS.MARKET, label: 'Estudio de mercado' },
];

export const SEARCH_EXAMPLES = [
  'Cuanto se ha invertido en vivienda?',
  'Quien recibio los contratos de reconstruccion?',
  'Que proyectos tienen alertas?',
];

export const DEPARTMENTS = [
  'Cundinamarca',
  'Antioquia',
  'Valle del Cauca',
  'Cauca',
  'Choco',
  'Santander',
  'Atlantico',
];

export const MUNICIPALITIES = [
  'Todos',
  'Bogota D.C.',
  'Tocancipa',
  'Medellin',
  'Cali',
  'Quibdo',
  'Bucaramanga',
];

export const SUMMARY_CARDS = [
  {
    id: 'contracts',
    label: 'Contratos analizados',
    value: '18.420',
    detail: '+12% este mes',
    tone: 'danger',
  },
  {
    id: 'risk',
    label: 'Hallazgos de riesgo',
    value: '127',
    detail: '38 requieren accion',
    tone: 'warning',
  },
  {
    id: 'oversight',
    label: 'Veedurias activas',
    value: '24',
    detail: '17 en tiempo',
    tone: 'success',
  },
];

export const MODULES = [
  {
    id: VIEWS.CITIZEN,
    title: 'Vigilar mi territorio',
    eyebrow: 'Ciudadania',
    description: 'Consulta contratos publicos por tema, departamento y municipio para detectar patrones relevantes.',
    metric: '$42.8B COP revisados',
  },
  {
    id: VIEWS.BUSINESS,
    title: 'Encontrar oportunidades',
    eyebrow: 'Empresas',
    description: 'Cruza el perfil comercial de una empresa con procesos abiertos y compatibilidad por territorio.',
    metric: '312 oportunidades',
  },
  {
    id: VIEWS.OVERSIGHT,
    title: 'Gestionar veedurias',
    eyebrow: 'Control social',
    description: 'Organiza hallazgos, comentarios, checklist de investigacion y documentos de soporte.',
    metric: '89 evidencias',
  },
  {
    id: VIEWS.RISK_MAP,
    title: 'Mapa de riesgo',
    eyebrow: 'Datos abiertos',
    description: 'Visualiza concentracion de proveedores y municipios con senales de seguimiento prioritario.',
    metric: '41 municipios',
  },
  {
    id: VIEWS.MARKET,
    title: 'Estudio de mercado',
    eyebrow: 'Gestion publica',
    description: 'Compara precios, proveedores frecuentes y contratos cerrados para estimar valores de referencia.',
    metric: '1.246 comparables',
  },
];

export const REQUESTS = [
  {
    id: 'TR-294',
    subject: 'Contratos de pavimentacion sector norte',
    priority: 'Alta',
    status: 'En revision',
  },
  {
    id: 'TR-293',
    subject: 'Presupuesto asignado a colegios rurales',
    priority: 'Media',
    status: 'Resuelto',
  },
  {
    id: 'TR-292',
    subject: 'Licitacion de recoleccion de residuos',
    priority: 'Baja',
    status: 'Nuevo',
  },
];

export const ALERTS = [
  {
    id: 'overrun',
    title: 'Sobrecosto detectado',
    detail: 'Contrato OP-2023-45 supera el 15% del presupuesto inicial.',
    tone: 'danger',
  },
  {
    id: 'delay',
    title: 'Retraso en obra',
    detail: 'Construccion puente sur presenta 30 dias de demora segun cronograma.',
    tone: 'warning',
  },
];

export const PUBLIC_OFFICIALS = [
  {
    id: 'official-1',
    name: 'Carlos Andres Gomez Martinez',
    role: 'Ordenador del gasto',
    entity: 'Alcaldia de Tocancipa',
  },
  {
    id: 'official-2',
    name: 'Maria Fernanda Rojas Castro',
    role: 'Supervisora',
    entity: 'Secretaria de Infraestructura',
  },
  {
    id: 'official-3',
    name: 'Luis Eduardo Perez Ramirez',
    role: 'Ordenador del gasto',
    entity: 'Gobernacion de Cundinamarca',
  },
];

export const PAYMENTS = [
  { id: 'phase-1', milestone: 'Fase previa', date: 'Q4 2024', amount: '$450M', status: 'Pagado' },
  { id: 'phase-2', milestone: 'Disenos detalle', date: 'Q2 2025', amount: '$820M', status: 'Pagado' },
  { id: 'phase-3', milestone: 'Obras principales', date: 'En curso', amount: '$5.2B', status: 'En ejecucion' },
];
