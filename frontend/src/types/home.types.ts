export type HomeIconName =
  | 'award'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'briefcase'
  | 'badge-check'
  | 'building-2'
  | 'calendar'
  | 'chevron-right'
  | 'clipboard'
  | 'home'
  | 'map'
  | 'monitor'
  | 'network'
  | 'opportunities'
  | 'people'
  | 'route'
  | 'scales'
  | 'search'
  | 'server'
  | 'shield'
  | 'sparkle'
  | 'trend'
  | 'wallet'
  | 'alert';

export type HomeNavigationTarget = 'ciudadano' | 'empresa' | 'estudio' | 'veedurias' | 'mapa' | 'ficha' | 'home';

export interface HomeNavItem {
  id: string;
  label: string;
  icon: HomeIconName;
  target: HomeNavigationTarget;
}

export interface HomeExample {
  id: string;
  label: string;
  icon: HomeIconName;
  tone: 'green' | 'lilac' | 'yellow';
  target: HomeNavigationTarget;
}

export interface HomeRoute {
  id: string;
  title: string;
  description: string;
  icon: HomeIconName;
  tone: 'green' | 'lilac' | 'yellow';
  target: HomeNavigationTarget;
}

export interface HomeViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
}
