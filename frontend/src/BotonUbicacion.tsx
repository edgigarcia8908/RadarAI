import { useState } from 'react';
import { municipioMasCercano } from './colombiaCoords';

/**
 * Botón "Usar mi ubicación" — pide geolocalización del navegador y sugiere
 * el departamento/municipio más cercano (de la lista real de municipios de
 * Colombia) en vez de que el usuario tenga que buscarlo en el selector.
 * El usuario sigue pudiendo cambiarlo a mano después — esto es una
 * sugerencia, no un filtro forzado.
 */
export default function BotonUbicacion({ onSugerir }: { onSugerir: (departamento: string, ciudad: string) => void }) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function usar() {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }
    setCargando(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cercano = municipioMasCercano(pos.coords.latitude, pos.coords.longitude);
        setCargando(false);
        if (cercano) onSugerir(cercano.departamento, cercano.ciudad);
        else setError('No se pudo determinar el municipio más cercano.');
      },
      () => {
        setCargando(false);
        setError('No se pudo obtener tu ubicación — dale permiso al navegador, o elige el municipio a mano.');
      },
      { timeout: 8000 },
    );
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <button type="button" onClick={usar} disabled={cargando} style={{ fontSize: 13, padding: '4px 10px' }}>
        {cargando ? 'Ubicando…' : '📍 Usar mi ubicación'}
      </button>
      {error && <p style={{ color: 'crimson', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}
