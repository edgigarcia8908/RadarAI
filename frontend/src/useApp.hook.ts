import { useCallback, useState } from 'react';
import type { AppMode, RadarContext, UseAppReturn } from './types/app.types';
import type { HomeNavigationTarget } from './types/home.types';

export default function useApp(): UseAppReturn {
  const [modo, setModo] = useState<AppMode>('home');
  const [veeduriaAbierta, setVeeduriaAbierta] = useState<string | null>(null);
  const [radarContext, setRadarContext] = useState<RadarContext>({
    department: '',
    municipality: '',
  });

  const navigateFromHome = useCallback((target: HomeNavigationTarget) => {
    setModo(target);
  }, []);

  const volverAlInicio = useCallback(() => {
    setModo('home');
    setVeeduriaAbierta(null);
  }, []);

  const handleTerritorioChange = useCallback((department: string, municipality: string) => {
    setRadarContext((current) => (
      current.department === department && current.municipality === municipality
        ? current
        : { department, municipality }
    ));
  }, []);

  const handleVeeduriaOpened = useCallback(() => {
    setVeeduriaAbierta(null);
  }, []);

  return {
    modo,
    veeduriaAbierta,
    radarContext,
    navigateFromHome,
    volverAlInicio,
    handleTerritorioChange,
    handleVeeduriaOpened,
  };
}
