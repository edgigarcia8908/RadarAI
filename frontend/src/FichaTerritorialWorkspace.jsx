/**
 * Ficha territorial — unico modulo de este workspace con datos 100% reales
 * (el resto de paneles del mockup usan constantes de ejemplo). Consolida
 * identidad DIVIPOLA, contratacion, presupuesto CUIPO, regalias SGR y
 * desempeno MDM de un municipio. Backend: src/ficha-territorial/.
 */
function money(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CO')}`;
}

export default function FichaTerritorialWorkspace({ radar }) {
  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Ficha territorial</p>
        <h2>Todo lo que RadarAI sabe de un municipio, en una pantalla</h2>

        <div className="filter-row" style={{ marginTop: 16 }}>
          <label>
            <span>Departamento</span>
            <select value={radar.fichaDepartamento} onChange={(event) => radar.setFichaDepartamento(event.target.value)}>
              {radar.departamentosColombia.map((d) => (
                <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Municipio</span>
            <select value={radar.fichaMunicipio} onChange={(event) => radar.setFichaMunicipio(event.target.value)}>
              {radar.fichaMunicipiosDisponibles.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="button" onClick={radar.handleCargarFicha} disabled={radar.fichaStatus === 'loading'}>
            {radar.fichaStatus === 'loading' ? 'Consultando...' : 'Ver ficha'}
          </button>
        </div>

        {radar.fichaStatus === 'error' && <p className="sigep-error">{radar.fichaError}</p>}

        {radar.ficha && <FichaContenido ficha={radar.ficha} />}
      </article>

      <aside className="side-stack">
        <article className="detail-card">
          <p className="section-label">Sobre esta ficha</p>
          <h3>Fuentes que combina</h3>
          <p className="muted">
            DIVIPOLA (identidad), SECOP II (contratacion), CUIPO (presupuesto), SGR (regalias, con brecha de ejecucion
            fisica vs. financiera), MDM (desempeno municipal DNP), SIRI y SIGEP (alertas de identidad de firmantes).
          </p>
        </article>
      </aside>
    </div>
  );
}

function FichaContenido({ ficha }) {
  return (
    <>
      {ficha.identidad ? (
        <div className="stat-row" style={{ marginTop: 20 }}>
          <Stat label="Municipio" value={`${ficha.identidad.nombreMunicipio}, ${ficha.identidad.nombreDepartamento}`} />
          <Stat label="Codigo DIVIPOLA" value={ficha.identidad.codigoDivipola} />
          <Stat label="Desempeno municipal (MDM)" value={ficha.desempenoMunicipal.puntaje != null ? `${ficha.desempenoMunicipal.puntaje.toFixed(1)}/100` : 'Sin dato'} highlighted />
        </div>
      ) : (
        <p className="muted" style={{ marginTop: 16 }}>No se pudo resolver la identidad DIVIPOLA de este municipio.</p>
      )}

      <div className="stat-row">
        <Stat label="Contratos sincronizados" value={ficha.contratacion.totalContratos.toLocaleString('es-CO')} />
        <Stat label="Valor total contratado" value={money(ficha.contratacion.valorTotal)} />
        <Stat label="Proveedores unicos" value={ficha.contratacion.proveedoresUnicos.toLocaleString('es-CO')} />
        <Stat
          label="Concentracion de proveedores"
          value={`${ficha.contratacion.concentracionProveedores}%`}
          highlighted={ficha.contratacion.concentracionProveedores >= 70}
        />
      </div>

      <h3 style={{ marginTop: 24 }}>Presupuesto vs. contratacion (CUIPO)</h3>
      {ficha.presupuesto.mensaje ? (
        <p className="muted">{ficha.presupuesto.mensaje}</p>
      ) : (
        <>
          <div className="stat-row">
            <Stat label="Presupuesto apropiado" value={money(ficha.presupuesto.presupuestoApropiado)} />
            <Stat label="Comprometido" value={money(ficha.presupuesto.comprometido)} />
            <Stat label="Pagado" value={money(ficha.presupuesto.pagado)} />
          </div>
          {ficha.presupuesto.alerta && (
            <div className="alert-item">
              <strong>Presupuesto</strong>
              <p>{ficha.presupuesto.alerta}</p>
            </div>
          )}
        </>
      )}

      {ficha.proyectosRegalias.length > 0 && (
        <>
          <h3 style={{ marginTop: 24 }}>Proyectos financiados con regalias (SGR)</h3>
          <div className="data-table compact" role="table" aria-label="Proyectos de regalias">
            <div className="table-row table-head" role="row">
              <span>Proyecto</span>
              <span>Valor</span>
              <span>Ejec. financiera</span>
              <span>Ejec. fisica</span>
            </div>
            {ficha.proyectosRegalias.slice(0, 6).map((p, i) => (
              <div className="table-row" role="row" key={i}>
                <span>{p.nombre}</span>
                <span>{money(p.valorTotal)}</span>
                <span>{p.ejecucionFinanciera ?? '—'}%</span>
                <span>{p.ejecucionFisica ?? '—'}%</span>
              </div>
            ))}
          </div>
          {ficha.alertaRegalias && (
            <div className="alert-item warning">
              <strong>Regalias</strong>
              <p>{ficha.alertaRegalias}</p>
            </div>
          )}
        </>
      )}

      <div className="sigep-panel">
        <div className="sigep-heading">
          <div>
            <p className="section-label">SIRI + SIGEP</p>
            <h3>Alertas de identidad</h3>
          </div>
        </div>
        <p className="sigep-disclaimer">
          Se revisaron {ficha.alertasIdentidad.nombresRevisados} de {ficha.alertasIdentidad.totalNombresDistintos} nombres
          distintos (firmantes, ordenadores del gasto, supervisores) contra SIRI (sanciones disciplinarias) y SIGEP
          (cargos de confianza). Son coincidencias de NOMBRE, no de identidad verificada.
        </p>
        <div className="stat-row">
          <Stat
            label="Coincidencias SIRI"
            value={ficha.alertasIdentidad.coincidenciasSiri > 0 ? String(ficha.alertasIdentidad.coincidenciasSiri) : 'Ninguna'}
            highlighted={ficha.alertasIdentidad.coincidenciasSiri > 0}
          />
          <Stat
            label="Coincidencias SIGEP"
            value={ficha.alertasIdentidad.coincidenciasSigep > 0 ? String(ficha.alertasIdentidad.coincidenciasSigep) : 'Ninguna'}
          />
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, highlighted = false }) {
  return (
    <div className={highlighted ? 'stat-card highlighted' : 'stat-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
