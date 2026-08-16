import type { OpportunityItem } from '../types/opportunities.types';

export const OPPORTUNITY_DEPARTMENTS = ['Cundinamarca', 'Antioquia', 'Valle del Cauca'];

export const OPPORTUNITY_MUNICIPALITIES = ['Todos', 'Chía', 'Zipaquirá', 'Tocancipá'];

export const OPPORTUNITY_PERIODS = ['Este año', 'Último año', 'Últimos 3 años'];

export const OPPORTUNITY_ITEMS: OpportunityItem[] = [
  {
    id: 'computers',
    title: 'Compra de computadores y periféricos para instituciones',
    entity: 'Alcaldía de Chía',
    competition: 'Competencia estimada\n5 a 10 empresas',
    recommendation: 'Recomendación\nTu solución cumple muy bien los requisitos.',
    priority: 'Alta posibilidad',
    icon: 'monitor',
    tone: 'purple',
  },
  {
    id: 'servers',
    title: 'Adquisición de servidores y almacenamiento',
    entity: 'Gobernación de Cundinamarca',
    competition: 'Competencia estimada\n3 a 8 empresas',
    recommendation: 'Recomendación\nTienes ventaja por experiencia previa.',
    priority: 'Alta posibilidad',
    icon: 'server',
    tone: 'purple',
  },
  {
    id: 'network',
    title: 'Renovación de red y cableado estructurado',
    entity: 'Alcaldía de Zipaquirá',
    competition: 'Competencia estimada\n8 a 15 empresas',
    recommendation: 'Recomendación\nAjusta tu propuesta a las especificaciones.',
    priority: 'Media posibilidad',
    icon: 'network',
    tone: 'mustard',
  },
];
