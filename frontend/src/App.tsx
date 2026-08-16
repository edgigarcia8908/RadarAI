import React, { useState } from 'react';
import FichaTerritorialView from './FichaTerritorialView';
import VeeduriasView from './VeeduriasView';
import HomeView from './components/home/HomeView';
import MapaRiesgoView from './components/map/MapaRiesgoView';
import SecondaryViewShell from './components/navigation/SecondaryViewShell';
import type { HomeNavigationTarget } from './types/home.types';

type Modo = 'home' | 'veedurias' | 'mapa' | 'ficha';

export default function App() {
  const [modo, setModo] = useState<Modo>('home');
  const [veeduriaAbierta, setVeeduriaAbierta] = useState<string | null>(null);

  function navigateFromHome(target: HomeNavigationTarget) {
    if (target === 'home' || target === 'veedurias' || target === 'mapa' || target === 'ficha') {
      setModo(target);
    }
  }

  function volverAlInicio() {
    setModo('home');
    setVeeduriaAbierta(null);
  }

  return (
    <div className={`app-shell app-shell-${modo}`}>
      {modo !== 'home' && (
        <button className="app-back-button" onClick={volverAlInicio} type="button">
          ← Volver al inicio
        </button>
      )}

      {modo === 'home' && (
        <HomeView
          onNavigate={navigateFromHome}
        />
      )}

      {modo === 'veedurias' && (
        <SecondaryViewShell activeTarget="veedurias" onNavigate={navigateFromHome}>
          <VeeduriasView abrirId={veeduriaAbierta} onAbierta={() => setVeeduriaAbierta(null)} />
        </SecondaryViewShell>
      )}
      {modo === 'mapa' && <MapaRiesgoView onNavigate={navigateFromHome} />}
      {modo === 'ficha' && (
        <SecondaryViewShell activeTarget="ficha" onNavigate={navigateFromHome}>
          <FichaTerritorialView />
        </SecondaryViewShell>
      )}
    </div>
  );
}
