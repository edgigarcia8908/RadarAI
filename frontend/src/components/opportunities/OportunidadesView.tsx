import React, { useEffect, useMemo, useState } from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import { OPPORTUNITY_PERIODS } from '../../constants/OPPORTUNITIES';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { OpportunitiesViewProps, OpportunityItem } from '../../types/opportunities.types';
import DataSourcesBadge from '../home/DataSourcesBadge';
import HomeIcon from '../home/HomeIcon';
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

export default function OportunidadesView({ onNavigate, onTerritorioChange }: OpportunitiesViewProps) {
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
    palabrasClaveUsadas,
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
    <div className="opportunities-page">
      <aside className="opportunities-sidebar">
        <div className="home-brand" aria-label="RadarAI">
          <span className="home-brand-mark"><span /><span /><span /></span>
          <span>RadarAI</span>
        </div>
        <nav className="home-nav" aria-label="Navegación principal">
          {HOME_NAV_ITEMS.map((item) => (
            <button
              className={`home-nav-item${item.target === 'empresa' ? ' opportunities-nav-active' : ''}`}
              key={item.id}
              onClick={() => onNavigate(item.target as HomeNavigationTarget)}
              title={item.description}
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
        <DataSourcesBadge />
      </aside>

      <section className="opportunities-form" aria-labelledby="opportunities-title">
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

        <button className="opportunities-search-button" onClick={handleSearch} type="button" disabled={isSearching}>
          <HomeIcon name="search" size={16} />
          <span>{isSearching ? 'Buscando oportunidades...' : 'Buscar oportunidades'}</span>
        </button>
        <p className="opportunities-note">Usamos datos oficiales de SECOP.</p>
        {searchError && <p className="opportunities-error">{searchError}</p>}

        {isSearching && (
          <>
            <ul className="opportunities-progress">
              <li>{paso === 'preparando' ? '⏳' : '✅'} Preparando perfil de tu empresa</li>
              <li className={paso === 'sincronizando' ? '' : 'opportunities-progress-pending'}>
                {paso === 'sincronizando' ? '⏳' : paso === 'calculando' ? '✅' : '○'} Sincronizando procesos de SECOP
              </li>
              <li className={paso === 'calculando' ? '' : 'opportunities-progress-pending'}>{paso === 'calculando' ? '⏳' : '○'} Calculando compatibilidad</li>
            </ul>
            {paso === 'sincronizando' && municipality === 'Todos' && (
              <p className="opportunities-note">Sincronizando todo {department} (varios municipios) — puede tardar 30-40 segundos la primera vez. Elegir un municipio específico es más rápido.</p>
            )}
          </>
        )}
      </section>

      <section className="opportunities-results" aria-labelledby="opportunities-results-title">
        <h2 id="opportunities-results-title">Oportunidades para tu empresa</h2>

        {!searched && !isSearching && <p className="opportunities-note">Completa el formulario y busca para ver oportunidades reales de SECOP.</p>}
        {searched && items.length === 0 && (
          <div className="opportunities-empty">
            <p className="opportunities-note">
              Ninguna oportunidad compatible todavía en {department} — ningún proceso abierto que revisamos menciona lo que describiste.
            </p>
            {palabrasClaveUsadas.length > 0 ? (
              <p className="opportunities-note">
                Buscamos con estas palabras: <strong>{palabrasClaveUsadas.join(', ')}</strong>. Si no son las correctas, describe tu producto/servicio con otros términos (idealmente los mismos que usaría una entidad pública) e intenta de nuevo.
              </p>
            ) : (
              <p className="opportunities-note">No logramos extraer palabras clave útiles de lo que escribiste — probá con una frase más descriptiva (ej. "mantenimiento de vías" en vez de una sola palabra).</p>
            )}
          </div>
        )}

        {items.map((item) => (
          <OpportunityCard key={item.id} item={item} abierto={abiertoId === item.id} onToggle={() => setAbiertoId((actual) => (actual === item.id ? null : item.id))} />
        ))}
      </section>
    </div>
  );
}
