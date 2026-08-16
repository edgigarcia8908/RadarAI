import type { HomeExample, HomeNavItem } from '../types/home.types';

export const HOME_NAV_ITEMS: HomeNavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'home', target: 'home' },
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
  },
  {
    id: 'business-opportunity',
    label: 'Tengo una empresa de computadores, ¿qué contratos puedo ganar?',
    icon: 'briefcase',
    tone: 'lilac',
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

export const HOME_PROMPT_PLACEHOLDER = '¿Qué quieres saber sobre plata pública?';
