export const MAP_RISK_FILTERS = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'high', label: 'Alto riesgo' },
  { value: 'medium', label: 'Riesgo medio' },
  { value: 'low', label: 'Bajo riesgo' },
] as const;

export const MAP_RISK_LEGEND = [
  { label: 'Alto', description: '80% o más concentrado', color: '#d85b52' },
  { label: 'Medio', description: '50% a 79% concentrado', color: '#d99b39' },
  { label: 'Bajo', description: 'Menos de 50% concentrado', color: '#4c9b68' },
];

export const MAP_DEFAULT_CENTER: [number, number] = [4.5709, -74.2973];
export const MAP_DEFAULT_ZOOM = 6;
