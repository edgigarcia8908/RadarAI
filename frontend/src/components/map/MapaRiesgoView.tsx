import React from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_RISK_FILTERS, MAP_RISK_LEGEND } from '../../constants/MAPA_RIESGO';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { MapRiskViewProps } from '../../types/map.types';
import HomeIcon from '../home/HomeIcon';
import useMapaRiesgo, { colorForRisk, radiusForContracts } from './useMapaRiesgo.hook';

export default function MapaRiesgoView({ onNavigate }: MapRiskViewProps) {
  const {
    department,
    riskFilter,
    departments,
    points,
    totalContracts,
    totalValue,
    municipalityCount,
    municipiosSinUbicar,
    isLoading,
    error,
    setDepartment,
    setRiskFilter,
  } = useMapaRiesgo();

  return (
    <div className="map-page">
      <aside className="map-sidebar">
        <div className="home-brand" aria-label="RadarAI">
          <span className="home-brand-mark"><span /><span /><span /></span>
          <span>RadarAI</span>
        </div>
        <nav className="home-nav" aria-label="Navegación principal">
          {HOME_NAV_ITEMS.map((item) => (
            <button
              className={`home-nav-item${item.target === 'mapa' ? ' map-nav-active' : ''}`}
              key={item.id}
              onClick={() => onNavigate(item.target as HomeNavigationTarget)}
              type="button"
            >
              <HomeIcon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="home-trust-note">
          <HomeIcon name="shield" size={20} />
          <span>Datos oficiales.<br />Respuestas<br />simples.</span>
        </div>
      </aside>

      <section className="map-control-panel" aria-labelledby="map-title">
        <span className="map-eyebrow"><HomeIcon name="map" size={15} /> Inteligencia territorial</span>
        <h1 id="map-title">Mapa de riesgo</h1>
        <p>Identifica los municipios donde la contratación está más concentrada en pocos proveedores.</p>

        <label className="map-field">
          <span>Departamento</span>
          <span className="map-input-wrap">
            <HomeIcon name="building-2" size={15} />
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              {departments.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <label className="map-field">
          <span>Nivel de riesgo</span>
          <span className="map-input-wrap">
            <HomeIcon name="alert" size={15} />
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)}>
              {MAP_RISK_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </span>
        </label>

        <div className="map-info-note">
          <HomeIcon name="shield" size={18} />
          <span>El color muestra concentración de proveedores. El tamaño indica la cantidad de contratos.</span>
        </div>

        <div className="map-legend" aria-label="Leyenda de riesgo">
          <strong>Cómo leer el mapa</strong>
          {MAP_RISK_LEGEND.map((item) => (
            <div className="map-legend-item" key={item.label}>
              <span className="map-legend-dot" style={{ backgroundColor: item.color }} />
              <span><strong>{item.label}</strong><small>{item.description}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="map-results" aria-labelledby="map-results-title">
        <div className="map-results-header">
          <div>
            <h2 id="map-results-title">Riesgo territorial</h2>
            <p>{department === 'Todos los departamentos' ? 'Todos los municipios sincronizados' : department}</p>
          </div>
          <span className="map-data-badge"><HomeIcon name="server" size={15} /> Datos SECOP</span>
        </div>

        <div className="map-stat-row">
          <div className="map-stat"><span>Municipios</span><strong>{municipalityCount}</strong></div>
          <div className="map-stat"><span>Contratos</span><strong>{totalContracts.toLocaleString('es-CO')}</strong></div>
          <div className="map-stat"><span>Valor contratado</span><strong>${totalValue.toLocaleString('es-CO')}</strong></div>
        </div>
        {municipiosSinUbicar > 0 && (
          <p className="map-note">
            {municipiosSinUbicar} municipio(s) con datos reales no se pudieron ubicar en el mapa (sin coordenadas conocidas) — no están contados arriba, pero sí en el filtro de departamento.
          </p>
        )}

        <div className="map-canvas-wrap">
          <MapContainer center={MAP_DEFAULT_CENTER} zoom={MAP_DEFAULT_ZOOM} className="map-canvas" scrollWheelZoom>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
            />
            {points.map((point) => {
              const color = colorForRisk(point.concentracionProveedores);
              return (
                <CircleMarker
                  center={[point.lat, point.lng]}
                  key={`${point.departamento}-${point.ciudad}`}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
                  radius={radiusForContracts(point.totalContratos)}
                >
                  <Tooltip>
                    <strong>{point.ciudad}, {point.departamento}</strong>
                    <br />
                    {point.totalContratos} contratos · ${point.valorTotal.toLocaleString('es-CO')}
                    <br />
                    {point.proveedoresUnicos} proveedores · {point.concentracionProveedores}% concentración
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
          {!isLoading && points.length === 0 && (
            <div className="map-empty-state">
              <HomeIcon name="map" size={26} />
              <strong>{error ? 'No pudimos cargar el mapa' : 'Aún no hay datos para mostrar'}</strong>
              <span>{error ?? 'Sincroniza un territorio desde Entender gasto para ver sus señales aquí.'}</span>
            </div>
          )}
          {isLoading && <div className="map-loading-state">Cargando datos territoriales...</div>}
        </div>
        <p className="map-footnote">La concentración se calcula sobre los contratos sincronizados. Un municipio con pocos contratos puede mostrar un porcentaje alto con una base pequeña.</p>
      </section>
    </div>
  );
}
