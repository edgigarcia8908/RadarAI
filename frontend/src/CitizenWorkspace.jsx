/** "Vigilar mi territorio" con datos reales — reemplaza el mock del workspace de Ciudadania. */
function money(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CO')}`;
}

function fecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Semáforo simplificado del contrato — misma lógica que ya se validó con
 * datos reales en la sesión anterior. `tono` usa las clases de badge que
 * ya existen en index.css (alta/media/baja/nuevo/en-ejecucion/pagado).
 */
function estadoContrato(c) {
  const hoy = new Date();
  const inicio = c.fechaDeInicio ? new Date(c.fechaDeInicio) : null;
  const fin = c.fechaDeFin ? new Date(c.fechaDeFin) : null;

  if (['cancelado', 'suspendido'].includes((c.estadoContrato || '').toLowerCase())) {
    return { texto: `⚠️ ${c.estadoContrato}`, tono: 'alta' };
  }
  if (c.liquidado) {
    if (fin && hoy < fin) return { texto: 'Liquidado antes de tiempo', tono: 'media' };
    return { texto: 'Finalizado y liquidado', tono: 'pagado' };
  }
  if (!inicio) return { texto: c.estadoContrato || 'Sin definir', tono: 'nuevo' };
  if (fin && hoy > fin) return { texto: 'Vencido sin liquidar', tono: 'alta' };
  return { texto: 'En ejecución', tono: 'en-ejecucion' };
}

export default function CitizenWorkspace({ radar }) {
  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Vigilar mi territorio</p>
        <h2>Inteligencia pública sobre contratación estatal (SECOP II real)</h2>

        <div className="filter-row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
          <label>
            <span>Departamento</span>
            <select value={radar.citizenDepartamento} onChange={(event) => radar.setCitizenDepartamento(event.target.value)}>
              {radar.departamentosColombia.map((d) => (
                <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Municipio</span>
            <select value={radar.citizenMunicipio} onChange={(event) => radar.setCitizenMunicipio(event.target.value)}>
              {radar.citizenMunicipiosDisponibles.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row" style={{ flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            <span>Tema</span>
            <input value={radar.citizenTema} onChange={(event) => radar.setCitizenTema(event.target.value)} />
          </label>
        </div>
        <div className="filter-row" style={{ flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: 260 }}>
            <span>Pregunta</span>
            <input value={radar.citizenPregunta} onChange={(event) => radar.setCitizenPregunta(event.target.value)} />
          </label>
        </div>
        <div className="filter-row">
          <label>
            <span>Desde</span>
            <input type="date" value={radar.citizenFechaDesde} onChange={(event) => radar.setCitizenFechaDesde(event.target.value)} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" value={radar.citizenFechaHasta} onChange={(event) => radar.setCitizenFechaHasta(event.target.value)} />
          </label>
        </div>

        <div className="filter-row">
          <button className="secondary-button" type="button" onClick={radar.handleSincronizarCitizen} disabled={radar.citizenSyncStatus === 'loading'}>
            {radar.citizenSyncStatus === 'loading' ? 'Trayendo de SECOP...' : '1. Sincronizar datos de SECOP'}
          </button>
          <button className="primary-button" type="button" onClick={radar.handleConsultarCitizen} disabled={radar.citizenConsultaStatus === 'loading'}>
            {radar.citizenConsultaStatus === 'loading' ? 'Analizando...' : '2. Preguntar'}
          </button>
        </div>

        {radar.citizenSyncInfo && <p className="muted">{radar.citizenSyncInfo}</p>}
        {radar.citizenError && <p className="sigep-error">{radar.citizenError}</p>}

        {radar.citizenResultado && <ResultadoCitizen radar={radar} />}
      </article>

      <aside className="side-stack">
        {radar.citizenPresupuesto && <PresupuestoPanel p={radar.citizenPresupuesto} />}
      </aside>
    </div>
  );
}

function ResultadoCitizen({ radar }) {
  const r = radar.citizenResultado;
  return (
    <>
      <div className="stat-row" style={{ marginTop: 20 }}>
        <Stat label="Territorio" value={r.resumen.territorio} />
        <Stat label="Contratos" value={r.resumen.totalContratos} />
        <Stat label="Valor total" value={money(r.resumen.valorTotalContratado)} />
        <Stat label="Proveedores" value={r.resumen.proveedoresUnicos} />
      </div>
      <p className="muted">{r.respuesta}</p>

      {r.hallazgos.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Hallazgos ({r.hallazgos.length})</h3>
          {r.hallazgos.map((h, i) => (
            <div className={h.severidad === 'ALTA' ? 'alert-item' : 'alert-item warning'} key={i}>
              <strong>{h.titulo}</strong>
              <p>{h.detalle}</p>
              <button className="text-button" type="button" onClick={() => radar.handleCrearVeeduria(`${h.titulo} — ${r.resumen.territorio}`)}>
                Crear veeduría a partir de este hallazgo →
              </button>
            </div>
          ))}
        </>
      )}

      {r.evidenciaContratos.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Contratos ({r.evidenciaContratos.length})</h3>
          <div className="data-table compact" role="table" aria-label="Contratos">
            <div className="table-row table-head" role="row">
              <span>Entidad</span>
              <span>Objeto</span>
              <span>Proveedor</span>
              <span>Valor</span>
              <span>Estado</span>
            </div>
            {r.evidenciaContratos.map((c) => {
              const estado = estadoContrato(c);
              const sancion = radar.citizenSanciones[c.nombreRepresentanteLegal] || radar.citizenSanciones[c.nombreOrdenadorDelGasto];
              const puesto = radar.citizenPuestosSensibles[c.nombreOrdenadorDelGasto] || radar.citizenPuestosSensibles[c.nombreSupervisor];
              return (
                <div className="table-row" role="row" key={c.idContrato}>
                  <span>{c.nombreEntidad}</span>
                  <span title={c.objetoDelContrato}>{(c.objetoDelContrato || '').slice(0, 60)}...</span>
                  <span>
                    {c.proveedorAdjudicado}
                    {sancion ? <span className="badge alta" style={{ marginLeft: 6 }}>SIRI</span> : null}
                    {puesto ? <span className="badge media" style={{ marginLeft: 6 }}>SIGEP</span> : null}
                  </span>
                  <span>{money(c.valorDelContrato)}</span>
                  <span><span className={`badge ${estado.tono}`}>{estado.texto}</span></span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function PresupuestoPanel({ p }) {
  if (p.mensaje) {
    return (
      <article className="detail-card">
        <p className="section-label">Presupuesto CUIPO</p>
        <p className="muted">{p.mensaje}</p>
      </article>
    );
  }
  return (
    <article className="detail-card">
      <p className="section-label">Presupuesto vs. contratación (CUIPO)</p>
      <h3>{p.entidad}</h3>
      <div className="stat-row">
        <Stat label="Apropiado" value={money(p.presupuestoApropiado)} />
        <Stat label="Comprometido" value={money(p.comprometido)} />
        <Stat label="Pagado" value={money(p.pagado)} />
      </div>
      {p.alerta && (
        <div className="alert-item warning" style={{ marginTop: 12 }}>
          <p>{p.alerta}</p>
        </div>
      )}
    </article>
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
