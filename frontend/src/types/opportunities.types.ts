import type { HomeNavigationTarget } from './home.types';

export type OpportunityIconName = 'monitor' | 'network' | 'server';

export interface OpportunityItem {
  id: string;
  title: string;
  entity: string;
  competition: string;
  recommendation: string;
  /** Todas las razones de compatibilidad que calculó el backend — antes solo se mostraba porQue[0]. */
  porQue: string[];
  modalidad: string;
  fechaPublicacion: string | null;
  precioBase: number;
  priority: 'Alta posibilidad' | 'Media posibilidad';
  icon: OpportunityIconName;
  tone: 'purple' | 'mustard';
}

export interface OpportunitiesViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
  onTerritorioChange?: (departamento: string, municipio: string) => void;
}
