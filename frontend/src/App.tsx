import { useState } from 'react';
import CiudadanoView from './CiudadanoView';
import EmpresaView from './EmpresaView';

type Modo = 'home' | 'ciudadano' | 'empresa';

export default function App() {
  const [modo, setModo] = useState<Modo>('home');

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '0 16px' }}>
      {modo !== 'home' && (
        <button onClick={() => setModo('home')} style={{ marginBottom: 16, background: 'transparent', color: '#1a2b6d', border: '1px solid #1a2b6d' }}>
          ← Volver
        </button>
      )}

      {modo === 'home' && (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h1>🛰️ RADAR</h1>
          <p style={{ color: '#555', marginBottom: 32 }}>Inteligencia pública y de mercado sobre contratación estatal.</p>
          <p style={{ marginBottom: 16 }}>¿Qué querés hacer?</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={() => setModo('ciudadano')} style={{ padding: '16px 24px', fontSize: 16 }}>
              🏛️ Vigilar mi territorio
            </button>
            <button onClick={() => setModo('empresa')} style={{ padding: '16px 24px', fontSize: 16 }}>
              💼 Encontrar oportunidades
            </button>
          </div>
        </div>
      )}

      {modo === 'ciudadano' && <CiudadanoView />}
      {modo === 'empresa' && <EmpresaView />}
    </div>
  );
}
