import React from 'react';
import type { HomeNavigationTarget } from '../../types/home.types';
import HomeIcon from '../home/HomeIcon';
import SecondaryViewShell from '../navigation/SecondaryViewShell';
import usePersona from './usePersona.hook';

function money(v: number | undefined) {
  return `$${Number(v || 0).toLocaleString('es-CO')}`;
}

interface PersonaViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
}

export default function PersonaView({ onNavigate }: PersonaViewProps) {
  const { nombre, setNombre, handleBuscar, status, error, perfil } = usePersona();

  return (
    <SecondaryViewShell activeTarget="persona" onNavigate={onNavigate}>
      <div className="persona-page">
        <h1>Perfil de persona</h1>
        <p>
          Busca a cualquier persona por nombre: en qué contratos aparece como ordenador del gasto, supervisor o
          representante legal, en cuántos municipios, y si su nombre coincide con sanciones disciplinarias (SIRI) o
          cargos sensibles a corrupción (SIGEP).
        </p>

        <form
          className="persona-search"
          onSubmit={(event) => {
            event.preventDefault();
            handleBuscar();
          }}
        >
          <span className="opportunities-input-wrap">
            <HomeIcon name="search" size={15} />
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Nombre completo, ej. Andrés Felipe Martínez Chamucero"
            />
          </span>
          <button className="persona-search-button" type="submit" disabled={status === 'loading'}>
            <HomeIcon name="search" size={16} />
            <span>{status === 'loading' ? 'Buscando…' : 'Buscar'}</span>
          </button>
        </form>
        {status === 'error' && <p className="compare-status-error">{error}</p>}
        <p className="opportunities-note">
          Búsqueda por nombre en todo lo ya sincronizado — no por cédula (SECOP no la trae). Un nombre común puede
          coincidir con una persona distinta; confirma antes de sacar conclusiones.
        </p>

        {perfil && perfil.totalContratos === 0 && status === 'success' && (
          <p className="compare-empty-state">
            No encontramos contratos donde "{perfil.nombre}" aparezca como ordenador del gasto, supervisor o
            representante legal en lo ya sincronizado.
            {(perfil.alertasSiri.length > 0 || perfil.alertasSigep.length > 0) && ' Sí hay coincidencias en SIRI/SIGEP, ver abajo.'}
          </p>
        )}

        {perfil && (perfil.totalContratos > 0 || perfil.alertasSiri.length > 0 || perfil.alertasSigep.length > 0) && (
          <div className="persona-results">
            {perfil.totalContratos > 0 && (
              <div className="understand-result-summary">
                <strong>
                  {perfil.totalContratos} contrato(s) · {money(perfil.valorTotal)} · {perfil.municipios.length} municipio(s)
                </strong>
              </div>
            )}

            {perfil.alerta && (
              <div className="persona-alert persona-alert-warning">
                <HomeIcon name="alert" size={18} />
                <span>{perfil.alerta}</span>
              </div>
            )}

            {perfil.alertasSiri.length > 0 && (
              <div className="persona-alert persona-alert-critical">
                <HomeIcon name="alert" size={18} />
                <span>
                  <strong>Coincidencia de nombre en SIRI (sanciones disciplinarias):</strong>{' '}
                  {perfil.alertasSiri.map((s) => `${s.sanciones || s.tipoInhabilidad || s.cargo}${s.entidadSancionado ? ` — ${s.entidadSancionado}` : ''}`).join('; ')}
                </span>
              </div>
            )}

            {perfil.alertasSigep.length > 0 && (
              <div className="persona-alert persona-alert-info">
                <HomeIcon name="shield" size={18} />
                <span>
                  <strong>Coincidencia de nombre en SIGEP (cargo sensible a corrupción):</strong>{' '}
                  {perfil.alertasSigep.map((s) => `${s.cargo} en ${s.entidad}`).join('; ')}
                </span>
              </div>
            )}

            {perfil.municipios.length > 0 && (
              <>
                <h3>Municipios donde aparece</h3>
                <ul className="persona-municipios">
                  {perfil.municipios.map((m) => (
                    <li key={`${m.departamento}-${m.ciudad}`}>
                      {m.ciudad}, {m.departamento} — {m.contratos} contrato(s)
                    </li>
                  ))}
                </ul>
              </>
            )}

            {perfil.proveedoresFrecuentes.length > 0 && (
              <>
                <h3>Proveedores que la acompañan</h3>
                <ul className="persona-municipios">
                  {perfil.proveedoresFrecuentes.slice(0, 8).map((p) => (
                    <li key={p.nombre}>
                      {p.nombre} — {p.contratos} contrato(s), {money(p.valorTotal)}
                      {p.municipios.length > 1 && ` (en ${p.municipios.length} municipios: ${p.municipios.join(', ')})`}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {perfil.contratos.length > 0 && (
              <>
                <h3>Contratos</h3>
                {perfil.contratos.map((c) => (
                  <a
                    key={c.idContrato}
                    className={`understand-alert understand-contract-link${c.urlProceso ? '' : ' understand-contract-link-disabled'}`}
                    href={c.urlProceso || undefined}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => { if (!c.urlProceso) event.preventDefault(); }}
                  >
                    <HomeIcon name="briefcase" size={16} />
                    <span>
                      {c.nombreEntidad} ({c.rol}) — {money(c.valorDelContrato)}
                      <br />
                      <small>{c.ciudad}, {c.departamento} · {(c.objetoDelContrato || '').slice(0, 90)}</small>
                    </span>
                    <HomeIcon name="chevron-right" size={15} />
                  </a>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </SecondaryViewShell>
  );
}
