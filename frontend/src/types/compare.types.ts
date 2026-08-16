import type { HomeNavigationTarget } from './home.types';

export type ProviderIconName = 'award' | 'badge-check' | 'building-2' | 'route';

export interface ProviderItem {
  id: string;
  name: string;
  experience: string;
  price: string;
  risk: string;
  riskTone: 'green' | 'mustard' | 'red';
  icon: ProviderIconName;
  featured?: boolean;
}

export interface CompareProvidersViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
}
