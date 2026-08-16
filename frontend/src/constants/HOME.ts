import type { HomeExample, HomeNavItem } from '../types/home.types';

export const HOME_NAV_ITEMS: HomeNavItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    subtitle: 'Pregúntale a RadarAI',
    description: 'Pregúntale a RadarAI en lenguaje natural sobre cualquier territorio.',
    icon: 'home',
    target: 'home',
  },
  {
    id: 'oversight',
    label: 'Veedurías',
    subtitle: 'Alertas detectadas por territorio',
    description: 'Elige un territorio, mira las alertas reales que detectamos ahí (concentración de proveedores, contratos casi idénticos) y abre una veeduría sobre lo que encuentres.',
    icon: 'shield',
    target: 'veedurias',
  },
  {
    id: 'opportunities',
    label: 'Encontrar oportunidades',
    subtitle: 'Procesos abiertos para tu empresa',
    description: 'Procesos ABIERTOS de SECOP que tu empresa puede ganar, según lo que vendés.',
    icon: 'opportunities',
    target: 'empresa',
  },
  {
    id: 'providers',
    label: 'Comparar proveedores',
    subtitle: 'Precios de contratos ya cerrados',
    description: 'Contratos YA CERRADOS de un tipo de servicio — precios reales para decidir con quién contratar.',
    icon: 'scales',
    target: 'estudio',
  },
  {
    id: 'person-profile',
    label: 'Perfil de persona',
    subtitle: 'Busca por nombre, no por objeto',
    description: 'Busca por NOMBRE (no por objeto del contrato): en qué contratos firma, ordena el gasto o supervisa alguien, y si tiene alertas SIRI/SIGEP.',
    icon: 'people',
    target: 'persona',
  },
  {
    id: 'risk-map',
    label: 'Mapa de riesgo',
    subtitle: 'Concentración por municipio',
    description: 'Vista geográfica de concentración de proveedores por municipio.',
    icon: 'map',
    target: 'mapa',
  },
  {
    id: 'territorial-sheet',
    label: 'Ficha territorial',
    subtitle: 'Resumen de un municipio',
    description: 'Resumen consolidado de un municipio: identidad, presupuesto, regalías y desempeño.',
    icon: 'building-2',
    target: 'ficha',
  },
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
