import React, { useState } from 'react';
import CiudadanoView from './CiudadanoView';
import EmpresaView from './EmpresaView';
import VeeduriasView from './VeeduriasView';
import FichaTerritorialView from './FichaTerritorialView';
import HomeView from './components/home/HomeView';
import EntenderGastoView from './components/understand/EntenderGastoView';
import OportunidadesView from './components/opportunities/OportunidadesView';
import CompararProveedoresView from './components/compare/CompararProveedoresView';
import MapaRiesgoView from './components/map/MapaRiesgoView';
import SecondaryViewShell from './components/navigation/SecondaryViewShell';
import AnnaMariaChat from './AnnaMariaChat';
import type { HomeNavigationTarget } from './types/home.types';

type Modo = 'home' | 'ciudadano' | 'empresa' | 'veedurias' | 'mapa' | 'estudio' | 'ficha';

export default function App() {
  const [modo, setModo] = useState<Modo>('home');
  // Cuando CiudadanoView crea una veeduría desde un hallazgo, salta directo a su detalle.
  const [veeduriaAbierta, setVeeduriaAbierta] = useState<string | null>(null);
  // Contexto territorial activo para que Anna María responda con datos reales de la región.
  const [departamentoActivo, setDepartamentoActivo] = useState<string>('');
  const [municipioActivo, setMunicipioActivo] = useState<string>('');

  function irAVeeduria(id: string) {
    setVeeduriaAbierta(id);
    setModo('veedurias');
  }

  function navigateFromHome(target: HomeNavigationTarget) {
    setModo(target);
  }

  return (
    <div className={modo === 'home' ? 'app-shell app-shell-home' : modo === 'ciudadano' ? 'app-shell app-shell-understand' : modo === 'empresa' ? 'app-shell app-shell-opportunities' : modo === 'estudio' ? 'app-shell app-shell-compare' : modo === 'mapa' ? 'app-shell app-shell-map' : 'app-shell app-shell-legacy'}>
      <AnnaMariaChat
        radar={{
          department: departamentoActivo,
          municipality: municipioActivo,
        }}
      />
      {modo !== 'home' && modo !== 'ciudadano' && modo !== 'empresa' && modo !== 'estudio' && (
        <button
          onClick={() => {
            setModo('home');
            setVeeduriaAbierta(null);
          }}
          style={{ marginBottom: 16, background: 'transparent', color: '#1a2b6d', border: '1px solid #1a2b6d' }}
        >
          ← Volver
        </button>
      )}

      {false && modo === 'home' && (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h1>🛰️ RADAR</h1>
          <p style={{ color: '#555', marginBottom: 32 }}>Inteligencia pública y de mercado sobre contratación estatal.</p>
          <p style={{ marginBottom: 16 }}>¿Qué quieres hacer?</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setModo('ciudadano')} style={{ padding: '16px 24px', fontSize: 16 }}>
              🏛️ Vigilar mi territorio
            </button>
            <button onClick={() => setModo('empresa')} style={{ padding: '16px 24px', fontSize: 16 }}>
              💼 Encontrar oportunidades
            </button>
            <button onClick={() => setModo('veedurias')} style={{ padding: '16px 24px', fontSize: 16 }}>
              🔍 Ver veedurías
            </button>
            <button onClick={() => setModo('mapa')} style={{ padding: '16px 24px', fontSize: 16 }}>
              🗺️ Mapa de riesgo
            </button>
            <button onClick={() => setModo('estudio')} style={{ padding: '16px 24px', fontSize: 16 }}>
              🏛️ Estudio de mercado
            </button>
            <button onClick={() => setModo('ficha')} style={{ padding: '16px 24px', fontSize: 16 }}>
              📍 Ficha territorial
            </button>
          </div>
        </div>
      )}

      {modo === 'home' && <HomeView onNavigate={navigateFromHome} />}

      {modo === 'ciudadano' && <EntenderGastoView onNavigate={navigateFromHome} />}
      {modo === 'empresa' && <OportunidadesView onNavigate={navigateFromHome} />}
      {modo === 'estudio' && <CompararProveedoresView onNavigate={navigateFromHome} />}
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
