import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { obtenerMapaRiesgo, MunicipioRiesgo } from './api';
import { COLOMBIA_LOCATIONS } from './colombiaCoords';

/** Busca lat/lng del municipio en el dataset geográfico — por nombre, sin distinguir mayúsculas/tildes exactas. */
function coordsDe(departamento: string, ciudad: string): { lat: number; lng: number } | null {
  const lista = COLOMBIA_LOCATIONS[departamento];
  if (!lista) return null;
  const match = lista.find((c) => c.name.localeCompare(ciudad, 'es', { sensitivity: 'base' }) === 0);
  return match ? { lat: match.lat, lng: match.lng } : null;
}

function colorPorRiesgo(concentracion: number): string {
  if (concentracion >= 80) return '#dc2626'; // rojo
  if (concentracion >= 50) return '#f59e0b'; // ámbar
  return '#16a34a'; // verde
}

export default function MapaView() {
  const [datos, setDatos] = useState<MunicipioRiesgo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerMapaRiesgo()
      .then(setDatos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  const puntos = datos
    .map((m) => ({ ...m, coords: coordsDe(m.departamento, m.ciudad) }))
    .filter((m): m is MunicipioRiesgo & { coords: { lat: number; lng: number } } => m.coords !== null);

  return (
    <div>
      <h1>🗺️ Mapa de riesgo</h1>
      <p style={{ color: '#555' }}>
        Concentración de proveedores por municipio, sobre lo que ya sincronizaste con SECOP — no es todo el país, solo lo
        que RadarAI ya trajo. Más rojo = más concentrado en pocos proveedores. El tamaño del punto es el número de
        contratos (con poca data, un municipio con 2 contratos y 1 proveedor da 100% sin que signifique gran cosa —
        mirá el tamaño del punto, no solo el color).
      </p>

      {cargando && <p>Cargando…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!cargando && puntos.length === 0 && (
        <p style={{ color: '#888' }}>Todavía no hay datos sincronizados en ningún territorio — andá a "Vigilar mi territorio" y sincronizá alguno primero.</p>
      )}

      {puntos.length > 0 && (
        <div style={{ height: 500, borderRadius: 12, overflow: 'hidden', border: '1px solid #ddd', marginTop: 16 }}>
          <MapContainer center={[4.5709, -74.2973]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
            />
            {puntos.map((m) => (
              <CircleMarker
                key={`${m.departamento}-${m.ciudad}`}
                center={[m.coords.lat, m.coords.lng]}
                radius={Math.max(6, Math.min(30, 5 + m.totalContratos * 1.5))}
                pathOptions={{ color: colorPorRiesgo(m.concentracionProveedores), fillColor: colorPorRiesgo(m.concentracionProveedores), fillOpacity: 0.55 }}
              >
                <Tooltip>
                  <strong>{m.ciudad}, {m.departamento}</strong>
                  <br />
                  {m.totalContratos} contratos · ${m.valorTotal.toLocaleString('es-CO')}
                  <br />
                  {m.proveedoresUnicos} proveedores únicos · {m.concentracionProveedores}% concentración
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
