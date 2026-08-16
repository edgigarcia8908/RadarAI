export const MAP_RISK_FILTERS = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'high', label: 'Alto riesgo' },
  { value: 'medium', label: 'Riesgo medio' },
  { value: 'low', label: 'Bajo riesgo' },
] as const;

export const MAP_RISK_LEGEND = [
  { label: 'Alto', description: '80% o más concentrado', color: '#c43d32' },
  { label: 'Medio', description: '50% a 79% concentrado', color: '#b98a00' },
  { label: 'Bajo', description: 'Menos de 50% concentrado', color: '#2c8d2b' },
];

export const MAP_DEFAULT_CENTER: [number, number] = [4.5709, -74.2973];
export const MAP_DEFAULT_ZOOM = 6;
