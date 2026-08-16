import React, { useEffect, useMemo, useState } from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import { COMPARE_PERIODS } from '../../constants/COMPARE_PROVIDERS';
import type { HomeNavigationTarget } from '../../types/home.types';
import type { CompareProvidersViewProps } from '../../types/compare.types';
import HomeIcon from '../home/HomeIcon';
import AppSidebar from '../navigation/AppSidebar';
import useCompareProviders from './useCompareProviders.hook';
import colombia from '../../colombia.json';

interface DeptoColombia {
  departamento: string;
  ciudades: string[];
}
const DEPARTAMENTOS = colombia as DeptoColombia[];

function money(v: number | undefined) {
  return `$${Number(v || 0).toLocaleString('es-CO')}`;
}

function ProviderCard({
  nombre,
  contratos,
  valorTotal,
  destacado,
  seleccionado,
  onClick,
}: {
  nombre: string;
  contratos: number;
  valorTotal: number;
  destacado?: boolean;
  seleccionado?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`provider-card provider-card-${destacado ? 'green' : 'mustard'}${seleccionado ? ' provider-card-selected' : ''}`}
      type="button"
      onClick={onClick}
      aria-pressed={seleccionado}
    >
      <span className="provider-icon"><HomeIcon name="badge-check" size={22} /></span>
      <span className="provider-main">
        <strong>{nombre}</strong>
        <span>Contratos comparables<br />● {contratos}</span>
      </span>
      <span className="provider-metrics">
        <strong>Valor total<br />{money(valorTotal)}</strong>
      </span>
    </button>
  );
}

export default function CompararProveedoresView({ onNavigate, onTerritorioChange }: CompareProvidersViewProps) {
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
    status,
    error,
    estudio,
  } = useCompareProviders();

  const municipiosDisponibles = useMemo(
    () => ['Todos', ...(DEPARTAMENTOS.find((d) => d.departamento === department)?.ciudades ?? [])],
    [department],
  );

  useEffect(() => {
    onTerritorioChange?.(department, municipality === 'Todos' ? '' : municipality);
  }, [department, municipality, onTerritorioChange]);

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string | null>(null);
  const contratosDelSeleccionado = useMemo(
    () => (estudio?.contratosComparables ?? []).filter((c) => c.proveedorAdjudicado === proveedorSeleccionado),
    [estudio, proveedorSeleccionado],
  );

  return (
    <div className="app-layout">
      <AppSidebar activeTarget="estudio" onNavigate={onNavigate} />
      <main className="app-main">
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

          <label className="compare-field">
            <span>Municipio</span>
            <span className="compare-input-wrap">
              <HomeIcon name="home" size={15} />
              <select value={municipality} onChange={(event) => setMunicipality(event.target.value)}>
                {municipiosDisponibles.map((option) => <option key={option}>{option}</option>)}
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

          <button className="btn btn-primary" onClick={handleCompare} type="button" disabled={status === 'loading' || !service.trim()}>
            <HomeIcon name="scales" size={16} />
            <span>{status === 'loading' ? 'Buscando…' : 'Comparar precios y proveedores'}</span>
          </button>
          {status === 'error' && <p className="compare-status compare-status-error">{error}</p>}
        </section>

      <section className="compare-results" aria-labelledby="compare-results-title">
        <h2 id="compare-results-title">Comparación de proveedores</h2>

        {!estudio && status !== 'loading' && (
          <p className="compare-empty-state">Describe qué necesitas contratar y dale "Comparar precios y proveedores" para ver contratos reales ya cerrados.</p>
        )}
        {estudio?.mensaje && <p className="compare-empty-state">{estudio.mensaje}</p>}

        {estudio && !estudio.mensaje && (
          <>
            <div className="understand-result-summary">
              <strong>
                {estudio.totalContratos} contratos comparables · mínimo {money(estudio.valorMinimo)} · mediana {money(estudio.valorMediana)} · máximo{' '}
                {money(estudio.valorMaximo)}
              </strong>
            </div>
            <p className="compare-results-hint">Haz clic en un proveedor para ver sus contratos comparables reales.</p>
            {estudio.proveedoresFrecuentes?.map((p, i) => (
              <ProviderCard
                key={p.nombre}
                nombre={p.nombre}
                contratos={p.contratos}
                valorTotal={p.valorTotal}
                destacado={i === 0}
                seleccionado={proveedorSeleccionado === p.nombre}
                onClick={() => setProveedorSeleccionado((actual) => (actual === p.nombre ? null : p.nombre))}
              />
            ))}
            {estudio.proveedoresFrecuentes?.[0] && (
              <div className="suggested-provider">
                <span className="suggested-icon"><HomeIcon name="award" size={22} /></span>
                <span className="suggested-copy">
                  <strong>Proveedor más frecuente</strong>
                  <span>
                    {estudio.proveedoresFrecuentes[0].nombre} — {estudio.proveedoresFrecuentes[0].contratos} contrato(s) comparables
                  </span>
                </span>
              </div>
            )}

            {proveedorSeleccionado && contratosDelSeleccionado.length > 0 && (
              <>
                <h3>Contratos de {proveedorSeleccionado}</h3>
                {contratosDelSeleccionado.map((c) => (
                  <a
                    key={c.idContrato}
                    className={`understand-alert understand-contract-link${c.urlProceso ? '' : ' understand-contract-link-disabled'}`}
                    href={c.urlProceso || undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => { if (!c.urlProceso) event.preventDefault(); }}
                  >
                    <HomeIcon name="briefcase" size={16} />
                    <span>{c.nombreEntidad} — {money(c.valorDelContrato)}</span>
                    <HomeIcon name="chevron-right" size={15} />
                  </a>
                ))}
              </>
            )}
          </>
        )}
      </section>
      </main>
    </div>
  );
}
