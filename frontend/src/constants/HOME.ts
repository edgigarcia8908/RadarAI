import type { HomeExample, HomeNavItem, HomeRoute } from '../types/home.types';

export const HOME_NAV_ITEMS: HomeNavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'home', target: 'home' },
  { id: 'spending', label: 'Entender gasto', icon: 'clipboard', target: 'ciudadano' },
  { id: 'opportunities', label: 'Encontrar oportunidades', icon: 'opportunities', target: 'empresa' },
  { id: 'providers', label: 'Comparar proveedores', icon: 'scales', target: 'estudio' },
  { id: 'oversight', label: 'Veedurías', icon: 'shield', target: 'veedurias' },
  { id: 'risk-map', label: 'Mapa de riesgo', icon: 'map', target: 'mapa' },
  { id: 'territorial-sheet', label: 'Ficha territorial', icon: 'building-2', target: 'ficha' },
  { id: 'contractor-tracking', label: 'Seguimiento de contratistas', icon: 'route', target: 'seguimiento' },
  { id: 'whistleblower', label: 'Denuncias', icon: 'alert', target: 'denuncias' },
  { id: 'business-match', label: 'Match empresarial', icon: 'network', target: 'match' },
];

export const HOME_EXAMPLES: HomeExample[] = [
  {
    id: 'municipal-spending',
    label: '¿En qué se gastó la alcaldía de Tocancipá este año?',
    icon: 'scales',
    tone: 'green',
    target: 'ciudadano',
  },
  {
    id: 'business-opportunity',
    label: 'Tengo una empresa de computadores, ¿qué contratos puedo ganar?',
    icon: 'briefcase',
    tone: 'lilac',
    target: 'empresa',
  },
  {
    id: 'provider-comparison',
    label: 'Voy a contratar mantenimiento de colegios, ¿qué proveedor conviene?',
    icon: 'people',
    tone: 'yellow',
    target: 'estudio',
  },
  {
    id: 'csv-alert',
    label: 'Me llegó un documento con sobrecostos, ¿qué hago?',
    icon: 'alert',
    tone: 'yellow',
    target: 'denuncias',
  },
];

export const HOME_ROUTES: HomeRoute[] = [
  {
    id: 'understand-spending',
    title: 'Entender gasto',
    description: 'Mira en qué se ha gastado el dinero público.',
    icon: 'trend',
    tone: 'green',
    target: 'ciudadano',
  },
  {
    id: 'find-opportunities',
    title: 'Encontrar oportunidades',
    description: 'Descubre contratos que tu empresa puede ganar.',
    icon: 'briefcase',
    tone: 'lilac',
    target: 'empresa',
  },
  {
    id: 'compare-providers',
    title: 'Comparar proveedores',
    description: 'Compara precios y elige al proveedor más conveniente.',
    icon: 'scales',
    tone: 'yellow',
    target: 'estudio',
  },
  {
    id: 'contractor-tracking',
    title: 'Seguimiento de contratistas',
    description: 'Sigue contratos en ejecución y detecta sobrecostos por proveedor.',
    icon: 'route',
    tone: 'green',
    target: 'seguimiento',
  },
  {
    id: 'whistleblower',
    title: 'Denuncias',
    description: 'Carga un documento y encuentra alertas contra SECOP.',
    icon: 'alert',
    tone: 'yellow',
    target: 'denuncias',
  },
  {
    id: 'business-match',
    title: 'Match empresarial',
    description: 'Encuentra contratos hechos a la medida de tu empresa.',
    icon: 'network',
    tone: 'lilac',
    target: 'match',
  },
];

export const HOME_PROMPT_PLACEHOLDER = '¿Qué quieres saber sobre plata pública?';
