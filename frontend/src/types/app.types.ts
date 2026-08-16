import type { HomeNavigationTarget } from './home.types';

export type AppMode = HomeNavigationTarget;

export interface RadarContext {
  department: string;
  municipality: string;
}

export interface UseAppReturn {
  modo: AppMode;
  veeduriaAbierta: string | null;
  radarContext: RadarContext;
  navigateFromHome: (target: HomeNavigationTarget) => void;
  volverAlInicio: () => void;
  handleTerritorioChange: (department: string, municipality: string) => void;
  handleVeeduriaOpened: () => void;
}
