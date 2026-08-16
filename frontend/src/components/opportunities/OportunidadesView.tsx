import React, { useEffect, useMemo, useState } from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import { OPPORTUNITY_PERIODS } from '../../constants/OPPORTUNITIES';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { OpportunitiesViewProps, OpportunityItem } from '../../types/opportunities.types';
import HomeIcon from '../home/HomeIcon';
import Breadcrumbs from '../navigation/Breadcrumbs';
import AppSidebar from '../navigation/AppSidebar';
import useOpportunities from './useOpportunities.hook';
import colombia from '../../colombia.json';

interface DeptoColombia {
  departamento: string;
  ciudades: string[];
}
const DEPARTAMENTOS = colombia as DeptoColombia[];

function money(v: number | undefined) {
  return `$${Number(v || 0).toLocaleString('es-CO')}`;
}

function OpportunityCard({ item, abierto, onToggle }: { item: OpportunityItem; abierto: boolean; onToggle: () => void }) {
  return (
    <div className={`opportunity-card opportunity-card-${item.tone}`}>
      <button className="opportunity-card-toggle" type="button" onClick={onToggle} aria-expanded={abierto}>
        <span className="opportunity-icon"><HomeIcon name={item.icon} size={22} /></span>
        <span className="opportunity-data">
          <strong>{item.title}</strong>
          <span className="opportunity-entity">{item.entity}</span>
          <span className="opportunity-details">
            <span>{item.competition}</span>
            <span>{item.recommendation}</span>
          </span>
        </span>
        <span className={`opportunity-priority opportunity-priority-${item.tone}`}>{item.priority}</span>
        <HomeIcon name="chevron-right" size={17} />
      </button>
      {abierto && (
        <div className="opportunity-expanded-details">
          <strong>Por qué es compatible:</strong>
          <ul className="opportunity-reasons">
            {item.porQue.map((razon) => <li key={razon}>{razon}</li>)}
          </ul>
          <p className="opportunity-expanded-meta">
            {item.modalidad || 'Modalidad no especificada'} · Valor base: {money(item.precioBase)}
          </p>
          {item.urlProceso ? (
            <a className="opportunity-link" href={item.urlProceso} target="_blank" rel="noopener noreferrer">
              Ver proceso en SECOP ↗
            </a>
          ) : (
            <p className="opportunity-link-disabled">SECOP no publicó un link directo para este proceso — busca la referencia {item.id} en secop.gov.co.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function OportunidadesView({ onNavigate, crumbLabel, onTerritorioChange }: OpportunitiesViewProps) {
  const {
    companyName,
    offer,
    department,
    municipality,
    period,
    locationEnabled,
    setCompanyName,
    setOffer,
    setDepartment,
    setMunicipality,
    setPeriod,
    toggleLocation,
    handleSearch,
    items,
    isSearching,
    paso,
    searchError,
    searched,
  } = useOpportunities();

  const municipiosDisponibles = useMemo(
    () => ['Todos', ...(DEPARTAMENTOS.find((d) => d.departamento === department)?.ciudades ?? [])],
    [department],
  );

  useEffect(() => {
    onTerritorioChange?.(department, municipality === 'Todos' ? '' : municipality);
  }, [department, municipality, onTerritorioChange]);

  const [abiertoId, setAbiertoId] = useState<string | null>(null);

  return (
    <div className="app-layout">
      <AppSidebar activeTarget="empresa" onNavigate={onNavigate} />
      <main className="app-main">
        <section className="opportunities-form" aria-labelledby="opportunities-title">
          {crumbLabel && (
            <Breadcrumbs items={[{ label: 'Inicio', onClick: () => onNavigate('home') }, { label: crumbLabel }]} />
          )}
          <h1 id="opportunities-title">Encontrar oportunidades para mi empresa</h1>
          <p>Te mostramos contratos que tu empresa puede ganar según lo que vendes.</p>

          <label className="opportunities-field">
            <span>Nombre de empresa</span>
            <span className="opportunities-input-wrap">
              <HomeIcon name="briefcase" size={15} />
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Nombre de tu empresa" />
            </span>
          </label>

          <label className="opportunities-field">
            <span>¿Qué vende tu empresa?</span>
            <span className="opportunities-input-wrap">
              <HomeIcon name="sparkle" size={15} />
              <input value={offer} onChange={(event) => setOffer(event.target.value)} placeholder="Productos o servicios" />
            </span>
          </label>

          <div className="opportunities-location-fields">
            <label className="opportunities-field">
              <span>Departamento</span>
              <span className="opportunities-input-wrap">
                <HomeIcon name="map" size={15} />
                <select
                  value={department}
                  onChange={(event) => {
                    setDepartment(event.target.value);
                    setMunicipality('Todos');
                  }}
                >
                  {DEPARTAMENTOS.map((d) => <option key={d.departamento}>{d.departamento}</option>)}
                </select>
              </span>
            </label>
            <label className="opportunities-field">
              <span>Municipio opcional</span>
              <span className="opportunities-input-wrap">
                <HomeIcon name="home" size={15} />
                <select value={municipality} onChange={(event) => setMunicipality(event.target.value)}>
                  {municipiosDisponibles.map((option) => <option key={option}>{option}</option>)}
                </select>
              </span>
            </label>
          </div>

          <button className={`opportunities-location${locationEnabled ? ' opportunities-location-active' : ''}`} onClick={toggleLocation} type="button">
            <HomeIcon name="map" size={18} />
            <span>Usar mi ubicación<br /><strong>{locationEnabled ? department : 'Ubicación desactivada'}</strong></span>
            <span className="opportunities-toggle" aria-hidden="true"><span /></span>
          </button>

          <label className="opportunities-field">
            <span>Período</span>
            <span className="opportunities-input-wrap">
              <HomeIcon name="calendar" size={15} />
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                {OPPORTUNITY_PERIODS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </span>
          </label>

          <button className="btn btn-primary" onClick={handleSearch} type="button" disabled={isSearching}>
            <HomeIcon name="search" size={16} />
            <span>{isSearching ? 'Buscando oportunidades...' : 'Buscar oportunidades'}</span>
          </button>
          <p className="opportunities-note">Usamos datos oficiales de SECOP.</p>
          {searchError && <p className="opportunities-error">{searchError}</p>}

          {isSearching && (
            <ul className="opportunities-progress">
              <li>{paso === 'preparando' ? '⏳' : '✅'} Preparando perfil y sincronizando SECOP</li>
              <li className={paso === 'calculando' ? '' : 'opportunities-progress-pending'}>{paso === 'calculando' ? '⏳' : paso === null ? '✅' : '○'} Calculando compatibilidad</li>
            </ul>
          )}
        </section>

      <section className="opportunities-results" aria-labelledby="opportunities-results-title">
        <h2 id="opportunities-results-title">Oportunidades para tu empresa</h2>

        {!searched && !isSearching && <p className="opportunities-note">Completa el formulario y busca para ver oportunidades reales de SECOP.</p>}
        {searched && items.length === 0 && (
          <p className="opportunities-note">Ninguna oportunidad compatible todavía en {department} — prueba ampliar el territorio o describir tu producto con otras palabras.</p>
        )}

        {items.map((item) => (
          <OpportunityCard key={item.id} item={item} abierto={abiertoId === item.id} onToggle={() => setAbiertoId((actual) => (actual === item.id ? null : item.id))} />
        ))}
<button className="btn btn-primary" type="button">
            <HomeIcon name="arrow-right" size={16} />
            <span>Ver todas las oportunidades</span>
          </button>
          <MatchScoreRadar />
        </section>
      </main>
    </div>
  );
}

interface RadarAxisDef {
  label: string;
  value: number;
  neutral?: boolean;
}

const RADAR_AXES: RadarAxisDef[] = [
  { label: 'Experiencia en rubro', value: 80 },
  { label: 'Baja competencia', value: 65 },
  { label: 'Ubicación', value: 70 },
  { label: 'Historial en SECOP', value: 45 },
  { label: 'Activos y maquinaria', value: 50, neutral: true },
];

function radarPoint(index: number, scale: number) {
  const angle = ((-90 + index * 72) * Math.PI) / 180;
  return { x: 100 + 70 * scale * Math.cos(angle), y: 100 + 70 * scale * Math.sin(angle) };
}

function MatchScoreRadar() {
  const promedio = Math.round(RADAR_AXES.reduce((sum, axis) => sum + axis.value, 0) / RADAR_AXES.length);

  return (
    <section className="opportunity-radar" aria-labelledby="radar-title">
      <h2 id="radar-title">Match empresarial</h2>
      <p className="opportunities-note">Qué tan a medida están las oportunidades para el perfil que indicaste.</p>
      <svg className="opportunity-radar-plot" viewBox="0 0 200 200" role="img" aria-label="Radar de compatibilidad de oportunidades">
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={RADAR_AXES.map((_, index) => {
              const point = radarPoint(index, level);
              return `${point.x},${point.y}`;
            }).join(' ')}
            fill="none"
            stroke="#dbe3da"
            strokeWidth={level === 1 ? 1.2 : 0.6}
          />
        ))}
        {RADAR_AXES.map((_, index) => {
          const point = radarPoint(index, 1);
          return <line key={index} x1={100} y1={100} x2={point.x} y2={point.y} stroke="#dbe3da" strokeWidth={0.6} />;
        })}
        <polygon
          points={RADAR_AXES.map((_, index) => {
            const point = radarPoint(index, RADAR_AXES[index].value / 100);
            return `${point.x},${point.y}`;
          }).join(' ')}
          fill="rgba(108, 148, 79, 0.2)"
          stroke="#6c944f"
          strokeWidth={1.5}
        />
        {RADAR_AXES.map((axis, index) => {
          const point = radarPoint(index, axis.value / 100);
          const label = radarPoint(index, 1.3);
          return (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r={2.4} fill="#6c944f" />
              <text x={label.x} y={label.y} fontSize={6} textAnchor={label.x < 92 ? 'end' : label.x > 108 ? 'start' : 'middle'} fill="#4a5548">
                <tspan x={label.x}>{axis.label}</tspan>
                <tspan x={label.x} dy={7.5} fontWeight={700} fill={axis.neutral ? '#b07b31' : '#6c944f'}>
                  {axis.value}%{axis.neutral ? ' · neutral' : ''}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
      <p className="opportunity-radar-score">
        Score de compatibilidad: <strong>{promedio}%</strong>
      </p>
      <p className="opportunities-note">
        SECOP no publica activos ni maquinaria de proveedores; ese eje queda en valor neutral.
        El radar es una estimación orientativa, no una calificación oficial.
      </p>
    </section>
  );
}
