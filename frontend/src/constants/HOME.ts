import type { HomeExample, HomeNavItem } from '../types/home.types';

export const HOME_NAV_ITEMS: HomeNavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'home', target: 'home' },
  { id: 'spending', label: 'Entender gasto', icon: 'clipboard', target: 'ciudadano' },
  { id: 'opportunities', label: 'Encontrar oportunidades', icon: 'opportunities', target: 'empresa' },
  { id: 'providers', label: 'Comparar proveedores', icon: 'scales', target: 'estudio' },
  { id: 'oversight', label: 'Veedurías', icon: 'shield', target: 'veedurias' },
  { id: 'risk-map', label: 'Mapa de riesgo', icon: 'map', target: 'mapa' },
  { id: 'territorial-sheet', label: 'Ficha territorial', icon: 'building-2', target: 'ficha' },
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
  },
];

export const HOME_PROMPT_PLACEHOLDER = '¿Qué quieres saber sobre plata pública?';
