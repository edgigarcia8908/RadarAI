import { useState } from 'react';
import CiudadanoView from './CiudadanoView';
import EmpresaView from './EmpresaView';
import VeeduriasView from './VeeduriasView';
import MapaView from './MapaView';
import EstudioMercadoView from './EstudioMercadoView';
import FichaTerritorialView from './FichaTerritorialView';

type Modo = 'home' | 'ciudadano' | 'empresa' | 'veedurias' | 'mapa' | 'estudio' | 'ficha';

export default function App() {
  const [modo, setModo] = useState<Modo>('home');
  // Cuando CiudadanoView crea una veeduría desde un hallazgo, salta directo a su detalle.
  const [veeduriaAbierta, setVeeduriaAbierta] = useState<string | null>(null);

  function irAVeeduria(id: string) {
    setVeeduriaAbierta(id);
    setModo('veedurias');
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 16px' }}>
      {modo !== 'home' && (
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

      {modo === 'home' && (
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

      {modo === 'ciudadano' && <CiudadanoView onRevisar={irAVeeduria} />}
      {modo === 'empresa' && <EmpresaView />}
      {modo === 'veedurias' && <VeeduriasView abrirId={veeduriaAbierta} onAbierta={() => setVeeduriaAbierta(null)} />}
      {modo === 'mapa' && <MapaView />}
      {modo === 'estudio' && <EstudioMercadoView />}
      {modo === 'ficha' && <FichaTerritorialView />}
    </div>
  );
}
