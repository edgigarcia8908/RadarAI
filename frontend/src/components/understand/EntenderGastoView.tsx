import React, { useEffect, useMemo } from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import { UNDERSTAND_PERIODS } from '../../constants/UNDERSTAND_GASTO';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { UnderstandGastoViewProps } from '../../types/understand.types';
import HomeIcon from '../home/HomeIcon';
import useUnderstandGasto from './useUnderstandGasto.hook';
import colombia from '../../colombia.json';

interface DeptoColombia {
  departamento: string;
  ciudades: string[];
}
const DEPARTAMENTOS = colombia as DeptoColombia[];

export default function EntenderGastoView({ onNavigate, onTerritorioChange }: UnderstandGastoViewProps) {
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
    status,
    paso,
    error,
    resultado,
    syncInfo,
    veeduriaCreadaId,
    handleCrearVeeduriaDesdeHallazgo,
  } = useUnderstandGasto();

  const municipiosDisponibles = useMemo(
    () => DEPARTAMENTOS.find((d) => d.departamento === departamento)?.ciudades ?? [],
    [departamento],
  );

  // Anna María (el chat flotante) necesita saber qué territorio está viendo
  // el usuario para responder con datos reales de esa región — antes esto
  // no se propagaba nunca y el chat quedaba ciego al territorio activo.
  useEffect(() => {
    onTerritorioChange?.(departamento, municipio);
  }, [departamento, municipio, onTerritorioChange]);

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
            <select
              value={departamento}
              onChange={(event) => {
                setDepartamento(event.target.value);
                setMunicipio(DEPARTAMENTOS.find((d) => d.departamento === event.target.value)?.ciudades[0] ?? '');
              }}
            >
              {DEPARTAMENTOS.map((d) => <option key={d.departamento}>{d.departamento}</option>)}
            </select>
          </span>
        </label>

        <label className="understand-field">
          <span>Municipio</span>
          <span className="understand-select-wrap">
            <HomeIcon name="home" size={15} />
            <select value={municipio} onChange={(event) => setMunicipio(event.target.value)}>
              {municipiosDisponibles.map((option) => <option key={option}>{option}</option>)}
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

        <button className="understand-analyze-button" onClick={handleAnalyze} type="button" disabled={status === 'loading'}>
          <HomeIcon name="sparkle" size={16} />
          <span>{status === 'loading' ? 'Analizando…' : 'Analizar municipio'}</span>
        </button>
        {syncInfo && <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>{syncInfo}</p>}
        {status === 'error' && <p style={{ fontSize: 13, color: 'crimson', marginTop: 8 }}>{error}</p>}
      </section>

      <section className="understand-results" aria-labelledby="understand-results-title">
        <h2 id="understand-results-title">Resultados para {municipio} ({periodo})</h2>

        {!resultado && status !== 'loading' && (
          <p style={{ color: '#666' }}>Elegí un municipio y dale "Analizar municipio" para traer datos reales de SECOP.</p>
        )}
        {status === 'loading' && (
          <ul style={{ listStyle: 'none', padding: 0, fontSize: 14, color: '#444' }}>
            <li>{paso === 'sincronizando' ? '⏳' : '✅'} Trayendo contratos reales de SECOP</li>
            <li style={{ opacity: paso === 'analizando' || paso === null ? 1 : 0.4 }}>
              {paso === 'analizando' ? '⏳' : paso === null ? '✅' : '○'} Cruzando alertas y presupuesto
            </li>
          </ul>
        )}

        {resultado && (
          <>
            <div className="understand-result-summary">
              <span className="understand-result-icon understand-result-icon-green"><HomeIcon name="wallet" size={22} /></span>
              <strong>
                {resultado.resumen.territorio} ha contratado ${resultado.resumen.valorTotalContratado.toLocaleString('es-CO')} en{' '}
                {resultado.resumen.totalContratos} contratos.
              </strong>
            </div>
            <div className="understand-result-summary understand-result-summary-white">
              <span className="understand-result-icon understand-result-icon-teal"><HomeIcon name="trend" size={22} /></span>
              <strong>{resultado.respuesta}</strong>
            </div>

            {resultado.hallazgos.length > 0 && (
              <>
                <h3>⚠️ Alertas para revisar</h3>
                <p style={{ fontSize: 13, color: '#666', margin: '4px 0 8px' }}>Haz clic en una alerta para abrir una veeduría y empezar a investigarla.</p>
                {resultado.hallazgos.map((h) => (
                  <button className="understand-alert" key={h.titulo} type="button" title={h.detalle} onClick={() => handleCrearVeeduriaDesdeHallazgo(h)}>
                    <HomeIcon name="alert" size={16} />
                    <span>{h.titulo} — {h.detalle}</span>
                    <HomeIcon name="chevron-right" size={15} />
                  </button>
                ))}
              </>
            )}

            {veeduriaCreadaId && (
              <div className="understand-cta">
                <strong>Veeduría creada.</strong>
                <button type="button" onClick={() => onNavigate('veedurias')}>
                  <span>Ver veedurías</span>
                  <HomeIcon name="arrow-up-right" size={16} />
                </button>
              </div>
            )}

            {resultado.evidenciaContratos.length > 0 && (
              <>
                <h3>Contratos ({resultado.evidenciaContratos.length})</h3>
                {resultado.evidenciaContratos.slice(0, 15).map((c) => (
                  <a
                    key={c.idContrato}
                    className="understand-alert"
                    href={c.urlProceso || undefined}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none', cursor: c.urlProceso ? 'pointer' : 'default' }}
                    onClick={(event) => { if (!c.urlProceso) event.preventDefault(); }}
                  >
                    <HomeIcon name="briefcase" size={16} />
                    <span>{c.nombreEntidad} — {c.proveedorAdjudicado} — ${c.valorDelContrato.toLocaleString('es-CO')}</span>
                    <HomeIcon name="chevron-right" size={15} />
                  </a>
                ))}
              </>
            )}

            <div className="understand-cta">
              <strong>Revisa los detalles y decide con confianza.</strong>
              <button type="button" onClick={() => onNavigate('veedurias')}>
                <span>Ver veedurías</span>
                <HomeIcon name="arrow-up-right" size={16} />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
