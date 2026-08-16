import React from 'react';
import FichaTerritorialView from './FichaTerritorialView';
import VeeduriasView from './VeeduriasView';
import AnnaMariaChat from './AnnaMariaChat';
import CompararProveedoresView from './components/compare/CompararProveedoresView';
import HomeView from './components/home/HomeView';
import MapaRiesgoView from './components/map/MapaRiesgoView';
import SeguimientoContratistasView from './SeguimientoContratistasView';
import DenunciasView from './components/denuncias/DenunciasView';
import SecondaryViewShell from './components/navigation/SecondaryViewShell';
import OportunidadesView from './components/opportunities/OportunidadesView';
import useApp from './useApp.hook';

export default function App() {
  const {
    modo,
    veeduriaAbierta,
    radarContext,
    navigateFromHome,
    volverAlInicio,
    handleTerritorioChange,
    handleVeeduriaOpened,
  } = useApp();

const irHome = volverAlInicio;

  return (
    <div className={`app-shell app-shell-${modo}`}>
      {modo !== 'home' && (
        <>
          <AnnaMariaChat radar={radarContext} />
          <button className="btn btn-ghost" onClick={volverAlInicio} type="button">
            ← Volver al inicio
          </button>
        </>
      )}

      {modo === 'home' && <HomeView onNavigate={navigateFromHome} />}

{modo === 'empresa' && (
        <OportunidadesView onNavigate={navigateFromHome} onTerritorioChange={handleTerritorioChange} />
      )}
      {modo === 'match' && (
        <OportunidadesView onNavigate={navigateFromHome} crumbLabel="Match empresarial" onTerritorioChange={handleTerritorioChange} />
      )}
      {modo === 'estudio' && (
        <CompararProveedoresView onNavigate={navigateFromHome} onTerritorioChange={handleTerritorioChange} />
      )}
      {modo === 'veedurias' && (
        <SecondaryViewShell activeTarget="veedurias" onNavigate={navigateFromHome}>
          <VeeduriasView abrirId={veeduriaAbierta} onAbierta={handleVeeduriaOpened} onHome={volverAlInicio} />
        </SecondaryViewShell>
      )}
      {modo === 'mapa' && <MapaRiesgoView onNavigate={navigateFromHome} />}
      {modo === 'ficha' && <FichaTerritorialView onHome={irHome} />}
      {modo === 'seguimiento' && (
        <SecondaryViewShell activeTarget="seguimiento" onNavigate={navigateFromHome}>
          <SeguimientoContratistasView onHome={irHome} />
        </SecondaryViewShell>
      )}
      {modo === 'denuncias' && (
        <SecondaryViewShell activeTarget="denuncias" onNavigate={navigateFromHome}>
          <DenunciasView onHome={irHome} />
        </SecondaryViewShell>
      )}
    </div>
  );
}
