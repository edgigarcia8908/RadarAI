import type { ProviderItem } from '../types/compare.types';

export const COMPARE_DEPARTMENTS = ['Cundinamarca', 'Antioquia', 'Valle del Cauca'];

export const COMPARE_MUNICIPALITIES = ['Todos', 'Chía', 'Zipaquirá', 'Tocancipá'];

export const COMPARE_PERIODS = ['Últimos 2 años', 'Último año', 'Últimos 3 años'];

export const PROVIDER_ITEMS: ProviderItem[] = [
  {
    id: 'construcampos',
    name: 'Construcampos SAS',
    experience: 'Alta (15 años)',
    price: '$ 1.245 millones',
    risk: 'Bajo',
    riskTone: 'green',
    icon: 'badge-check',
  },
  {
    id: 'vias-andinas',
    name: 'Vías Andinas Ltda.',
    experience: 'Media (8 años)',
    price: '$ 1.318 millones',
    risk: 'Medio',
    riskTone: 'mustard',
    icon: 'route',
  },
  {
    id: 'infraestructura-total',
    name: 'Infraestructura Total SAS',
    experience: 'Media (6 años)',
    price: '$ 1.462 millones',
    risk: 'Alto',
    riskTone: 'red',
    icon: 'building-2',
  },
];

export const SUGGESTED_PROVIDER: ProviderItem = {
  id: 'suggested',
  name: 'Construcampos SAS ofrece el mejor equilibrio entre precio, experiencia y riesgo para este contrato.',
  experience: '',
  price: '',
  risk: '',
  riskTone: 'green',
  icon: 'award',
  featured: true,
};
