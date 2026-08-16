import React from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import {
  COMPARE_DEPARTMENTS,
  COMPARE_MUNICIPALITIES,
  COMPARE_PERIODS,
  PROVIDER_ITEMS,
  SUGGESTED_PROVIDER,
} from '../../constants/COMPARE_PROVIDERS';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { CompareProvidersViewProps, ProviderItem } from '../../types/compare.types';
import HomeIcon from '../home/HomeIcon';
import useCompareProviders from './useCompareProviders.hook';

function ProviderCard({ provider }: { provider: ProviderItem }) {
  return (
    <button className={`provider-card provider-card-${provider.riskTone}`} type="button">
      <span className="provider-icon"><HomeIcon name={provider.icon} size={22} /></span>
      <span className="provider-main">
        <strong>{provider.name}</strong>
        <span>Experiencia<br />● {provider.experience}</span>
      </span>
      <span className="provider-metrics">
        <strong>Precio de referencia<br />{provider.price}</strong>
        <span>Riesgo<br />● {provider.risk}</span>
      </span>
    </button>
  );
}

export default function CompararProveedoresView({ onNavigate }: CompareProvidersViewProps) {
  const {
    service,
    department,
    municipality,
    period,
    setService,
    setDepartment,
    setMunicipality,
    setPeriod,
    handleCompare,
  } = useCompareProviders();

  return (
    <div className="compare-page">
      <aside className="compare-sidebar">
        <div className="home-brand" aria-label="RadarAI">
          <span className="home-brand-mark"><span /><span /><span /></span>
          <span>RadarAI</span>
        </div>
        <nav className="home-nav" aria-label="Navegación principal">
          {HOME_NAV_ITEMS.map((item) => (
            <button
              className={`home-nav-item${item.target === 'estudio' ? ' compare-nav-active' : ''}`}
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

      <section className="compare-form" aria-labelledby="compare-title">
        <h1 id="compare-title">Comparar proveedores antes de contratar</h1>
        <p>Compara precios, experiencia y riesgos para elegir al mejor proveedor.</p>

        <label className="compare-field">
          <span>¿Qué necesitas contratar?</span>
          <span className="compare-input-wrap">
            <HomeIcon name="briefcase" size={15} />
            <input value={service} onChange={(event) => setService(event.target.value)} placeholder="Ej. mantenimiento de vías" />
          </span>
        </label>

        <label className="compare-field">
          <span>Departamento</span>
          <span className="compare-input-wrap">
            <HomeIcon name="map" size={15} />
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              {COMPARE_DEPARTMENTS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <label className="compare-field">
          <span>Municipio</span>
          <span className="compare-input-wrap">
            <HomeIcon name="home" size={15} />
            <select value={municipality} onChange={(event) => setMunicipality(event.target.value)}>
              {COMPARE_MUNICIPALITIES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <label className="compare-field">
          <span>Período para comparar</span>
          <span className="compare-input-wrap">
            <HomeIcon name="calendar" size={15} />
            <select value={period} onChange={(event) => setPeriod(event.target.value)}>
              {COMPARE_PERIODS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <button className="compare-button" onClick={handleCompare} type="button">
          <HomeIcon name="scales" size={16} />
          <span>Comparar precios y proveedores</span>
        </button>
      </section>

      <section className="compare-results" aria-labelledby="compare-results-title">
        <h2 id="compare-results-title">Comparación de proveedores</h2>
        {PROVIDER_ITEMS.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
        <div className="suggested-provider">
          <span className="suggested-icon"><HomeIcon name={SUGGESTED_PROVIDER.icon} size={22} /></span>
          <span className="suggested-copy">
            <strong>Proveedor sugerido</strong>
            <span>{SUGGESTED_PROVIDER.name}</span>
          </span>
          <button type="button">
            <HomeIcon name="arrow-right" size={16} />
            <span>Ver detalles</span>
          </button>
        </div>
      </section>
    </div>
  );
}
