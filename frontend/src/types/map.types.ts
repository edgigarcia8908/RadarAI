import type { MunicipioRiesgo } from '../api';

export type MapRiskFilter = 'all' | 'high' | 'medium' | 'low';

export interface MapRiskPoint extends MunicipioRiesgo {
  lat: number;
  lng: number;
}

export interface MapRiskViewProps {
  onNavigate: (target: import('./home.types').HomeNavigationTarget) => void;
}

export interface UseMapRiskReturn {
  department: string;
  riskFilter: MapRiskFilter;
  departments: string[];
  points: MapRiskPoint[];
  totalContracts: number;
  totalValue: number;
  municipalityCount: number;
  /** Municipios con datos reales que no se pudieron ubicar en el mapa (sin match de coordenadas) — igual cuentan para el filtro de departamento. */
  municipiosSinUbicar: number;
  isLoading: boolean;
  error: string | null;
  setDepartment: (value: string) => void;
  setRiskFilter: (value: MapRiskFilter) => void;
}
