import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { COLOMBIA_LOCATIONS } from './colombiaCoords';

/**
 * Mapa de riesgo: combina el mockup visual del equipo (mismo contenedor
 * .map-illustration, mismo card lateral "Detalles especificos") con el
 * mapa Leaflet real que ya se habia construido y verificado antes de la
 * reescritura del frontend — datos reales, no los 4 puntos fijos de
 * ejemplo. Cuando todavia no hay nada sincronizado, se usa la ilustracion
 * decorativa original como estado vacio en vez de un mapa Leaflet en blanco.
 */
const ALIAS_DEPARTAMENTO = {
  'distrito capital de bogotá': 'Bogotá, D.c.',
};

function coordsDe(departamento, ciudad) {
  const clave = ALIAS_DEPARTAMENTO[departamento.toLowerCase()] || departamento;
  const lista = COLOMBIA_LOCATIONS[clave];
  if (!lista) return null;
  const match = lista.find((c) => c.name.localeCompare(ciudad, 'es', { sensitivity: 'base' }) === 0);
  return match ? { lat: match.lat, lng: match.lng } : null;
}

function colorPorRiesgo(concentracion) {
  if (concentracion >= 80) return '#dc2626';
  if (concentracion >= 50) return '#e6aa00';
  return '#1f7a4d';
}

export default function RiskMapWorkspace({ radar }) {
  useEffect(() => {
    if (radar.mapaStatus === 'idle') radar.handleCargarMapa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const puntos = radar.mapaDatos
    .map((m) => ({ ...m, coords: coordsDe(m.departamento, m.ciudad) }))
    .filter((m) => m.coords !== null);

  const masConcentrado = [...radar.mapaDatos].sort((a, b) => b.concentracionProveedores - a.concentracionProveedores)[0];

  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Mapa de riesgo</p>
        <h2>Concentracion de proveedores por municipio</h2>

        {radar.mapaStatus === 'loading' && <p className="muted">Cargando lo ya sincronizado...</p>}
        {radar.mapaError && <p className="sigep-error">{radar.mapaError}</p>}

        {puntos.length > 0 ? (
          <div className="map-illustration" style={{ background: 'none', padding: 0 }}>
            <MapContainer center={[4.5709, -74.2973]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
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
        ) : (
          radar.mapaStatus !== 'loading' && (
            <div className="map-illustration" aria-label="Sin datos sincronizados todavia">
              <span className="map-dot dot-one" />
              <span className="map-dot dot-two" />
              <span className="map-dot dot-three" />
              <span className="map-dot dot-four" />
            </div>
          )
        )}
        {radar.mapaStatus === 'success' && puntos.length === 0 && (
          <p className="muted">Todavía no hay datos sincronizados en ningún territorio — ve a "Ciudadania" y sincroniza alguno primero.</p>
        )}
      </article>
      <aside className="detail-card">
        <p className="section-label">Detalles especificos</p>
        {masConcentrado ? (
          <>
            <h3>Mayor concentración</h3>
            <p className="muted">
              {masConcentrado.ciudad} registra {masConcentrado.concentracionProveedores}% de valor adjudicado en pocos
              proveedores ({masConcentrado.totalContratos} contratos, ${masConcentrado.valorTotal.toLocaleString('es-CO')}).
            </p>
          </>
        ) : (
          <p className="muted">Sin datos todavía.</p>
        )}
      </aside>
    </div>
  );
}
