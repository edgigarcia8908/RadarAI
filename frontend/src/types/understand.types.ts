import type { HomeNavigationTarget } from './home.types';

export interface UnderstandGastoViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
}

export interface UnderstandGastoFormState {
  departamento: string;
  municipio: string;
  periodo: string;
  pregunta: string;
}
