import type { HomeNavigationTarget } from './home.types';

export type OpportunityIconName = 'monitor' | 'network' | 'server';

export interface OpportunityItem {
  id: string;
  title: string;
  entity: string;
  competition: string;
  recommendation: string;
  priority: 'Alta posibilidad' | 'Media posibilidad';
  icon: OpportunityIconName;
  tone: 'purple' | 'mustard';
}

export interface OpportunitiesViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
  crumbLabel?: string;
}
