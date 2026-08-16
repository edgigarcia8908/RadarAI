import React from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import {
  OPPORTUNITY_DEPARTMENTS,
  OPPORTUNITY_MUNICIPALITIES,
  OPPORTUNITY_PERIODS,
} from '../../constants/OPPORTUNITIES';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { OpportunitiesViewProps } from '../../types/opportunities.types';
import HomeIcon from '../home/HomeIcon';
import useOpportunities from './useOpportunities.hook';

export default function OportunidadesView({ onNavigate }: OpportunitiesViewProps) {
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
    searchError,
  } = useOpportunities();

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
              <select value={department} onChange={(event) => setDepartment(event.target.value)}>
                {OPPORTUNITY_DEPARTMENTS.map((option) => <option key={option}>{option}</option>)}
              </select>
            </span>
          </label>
          <label className="opportunities-field">
            <span>Municipio opcional</span>
            <span className="opportunities-input-wrap">
              <HomeIcon name="home" size={15} />
              <select value={municipality} onChange={(event) => setMunicipality(event.target.value)}>
                {OPPORTUNITY_MUNICIPALITIES.map((option) => <option key={option}>{option}</option>)}
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

        <button className="opportunities-search-button" onClick={handleSearch} type="button">
          <HomeIcon name="search" size={16} />
          <span>{isSearching ? 'Buscando oportunidades...' : 'Buscar oportunidades'}</span>
        </button>
        <p className="opportunities-note">Usamos datos oficiales de SECOP.</p>
        {searchError && <p className="opportunities-error">{searchError}</p>}
      </section>

      <section className="opportunities-results" aria-labelledby="opportunities-results-title">
        <h2 id="opportunities-results-title">Oportunidades para tu empresa</h2>
        {items.map((item) => (
          <button className={`opportunity-card opportunity-card-${item.tone}`} key={item.id} type="button">
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
        ))}
        <button className="opportunities-all-button" type="button">
          <HomeIcon name="arrow-right" size={16} />
          <span>Ver todas las oportunidades</span>
        </button>
      </section>
    </div>
  );
}
