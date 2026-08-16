import React from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import {
  UNDERSTAND_ALERTS,
  UNDERSTAND_DEPARTMENTS,
  UNDERSTAND_MUNICIPALITIES,
  UNDERSTAND_PERIODS,
  UNDERSTAND_SUMMARY,
  UNDERSTAND_TOPICS,
} from '../../constants/UNDERSTAND_GASTO';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { UnderstandGastoViewProps } from '../../types/understand.types';
import HomeIcon from '../home/HomeIcon';
import useUnderstandGasto from './useUnderstandGasto.hook';

export default function EntenderGastoView({ onNavigate }: UnderstandGastoViewProps) {
  const {
    departamento,
    municipio,
    periodo,
    pregunta,
    setDepartamento,
    setMunicipio,
    setPeriodo,
    setPregunta,
    handleAnalyze,
  } = useUnderstandGasto();

  return (
    <div className="understand-page">
      <aside className="understand-sidebar">
        <div className="home-brand" aria-label="RadarAI">
          <span className="home-brand-mark"><span /><span /><span /></span>
          <span>RadarAI</span>
        </div>
        <nav className="home-nav" aria-label="Navegación principal">
          {HOME_NAV_ITEMS.map((item) => (
            <button
              className={`home-nav-item${item.target === 'ciudadano' ? ' home-nav-item-active' : ''}`}
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

      <section className="understand-form-panel" aria-labelledby="understand-title">
        <h1 id="understand-title">Entender gasto público</h1>
        <p>Descubre en qué se ha gastado el dinero público y entiende los contratos de tu municipio.</p>

        <label className="understand-field">
          <span>Departamento</span>
          <span className="understand-select-wrap">
            <HomeIcon name="map" size={15} />
            <select value={departamento} onChange={(event) => setDepartamento(event.target.value)}>
              {UNDERSTAND_DEPARTMENTS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <label className="understand-field">
          <span>Municipio</span>
          <span className="understand-select-wrap">
            <HomeIcon name="home" size={15} />
            <select value={municipio} onChange={(event) => setMunicipio(event.target.value)}>
              {UNDERSTAND_MUNICIPALITIES.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <label className="understand-field">
          <span>Período</span>
          <span className="understand-select-wrap">
            <HomeIcon name="calendar" size={15} />
            <select value={periodo} onChange={(event) => setPeriodo(event.target.value)}>
              {UNDERSTAND_PERIODS.map((option) => <option key={option}>{option}</option>)}
            </select>
          </span>
        </label>

        <label className="understand-field understand-question-field">
          <span>Pregunta opcional</span>
          <span className="understand-input-wrap">
            <HomeIcon name="sparkle" size={15} />
            <input value={pregunta} onChange={(event) => setPregunta(event.target.value)} placeholder="¿Qué quieres saber?" />
          </span>
        </label>

        <button className="understand-analyze-button" onClick={handleAnalyze} type="button">
          <HomeIcon name="sparkle" size={16} />
          <span>Analizar municipio</span>
        </button>
      </section>

      <section className="understand-results" aria-labelledby="understand-results-title">
        <h2 id="understand-results-title">Resultados para {municipio} ({periodo})</h2>
        <div className="understand-result-summary">
          <span className="understand-result-icon understand-result-icon-green"><HomeIcon name="wallet" size={22} /></span>
          <strong>{UNDERSTAND_SUMMARY}</strong>
        </div>
        <div className="understand-result-summary understand-result-summary-white">
          <span className="understand-result-icon understand-result-icon-teal"><HomeIcon name="trend" size={22} /></span>
          <strong>{UNDERSTAND_TOPICS}</strong>
        </div>

        <h3>⚠️ Alertas para revisar</h3>
        {UNDERSTAND_ALERTS.map((alert) => (
          <button className="understand-alert" key={alert} type="button">
            <HomeIcon name="alert" size={16} />
            <span>{alert}</span>
            <HomeIcon name="chevron-right" size={15} />
          </button>
        ))}

        <div className="understand-cta">
          <strong>Revisa los detalles y decide con confianza.</strong>
          <button type="button" onClick={() => onNavigate('ciudadano')}>
            <span>Ver detalles</span>
            <HomeIcon name="arrow-up-right" size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
