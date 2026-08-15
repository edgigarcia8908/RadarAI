/** Estudio de mercado con datos reales — reemplaza el mock del workspace de Gestion publica. */
function money(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CO')}`;
}

export default function MarketWorkspace({ radar }) {
  const e = radar.marketEstudio;

  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Estudio de mercado</p>
        <h2>Contratos comparables ya terminados/cerrados para el objeto que describas</h2>

        <div className="filter-row" style={{ flexWrap: 'wrap', marginTop: 16 }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            <span>Objeto a contratar</span>
            <input value={radar.marketObjeto} onChange={(event) => radar.setMarketObjeto(event.target.value)} />
          </label>
          <label>
            <span>Departamento</span>
            <select value={radar.marketDepartamento} onChange={(event) => radar.setMarketDepartamento(event.target.value)}>
              {radar.departamentosColombia.map((d) => (
                <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Municipio</span>
            <select value={radar.marketMunicipio} onChange={(event) => radar.setMarketMunicipio(event.target.value)}>
              {radar.marketMunicipiosDisponibles.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          <label>
            <span>Desde</span>
            <input type="date" value={radar.marketFechaDesde} onChange={(event) => radar.setMarketFechaDesde(event.target.value)} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" value={radar.marketFechaHasta} onChange={(event) => radar.setMarketFechaHasta(event.target.value)} />
          </label>
          <button className="primary-button" type="button" onClick={radar.handleGenerarEstudio} disabled={radar.marketStatus === 'loading'}>
            {radar.marketStatus === 'loading' ? 'Buscando...' : 'Generar estudio'}
          </button>
        </div>

        {radar.marketError && <p className="sigep-error">{radar.marketError}</p>}
        {e && e.mensaje && <p className="muted">{e.mensaje}</p>}

        {e && !e.mensaje && (
          <>
            <div className="stat-row">
              <Stat label="Valor mínimo" value={money(e.valorMinimo)} />
              <Stat label="Promedio" value={money(e.valorPromedio)} />
              <Stat label="Mediana" value={money(e.valorMediana)} />
              <Stat label="Valor máximo" value={money(e.valorMaximo)} />
            </div>
            <div className="stat-row">
              <Stat label="Contratos comparables" value={e.totalContratos} />
              <Stat label="Proveedores únicos" value={e.proveedoresUnicos} />
              <Stat label="Duración promedio" value={e.duracionPromedioDias ? `${e.duracionPromedioDias} días` : '—'} />
            </div>

            {e.contratosComparables?.length > 0 && (
              <div className="data-table compact" role="table" aria-label="Contratos comparables">
                <div className="table-row table-head" role="row">
                  <span>Entidad</span>
                  <span>Objeto</span>
                  <span>Proveedor</span>
                  <span>Valor</span>
                </div>
                {e.contratosComparables.slice(0, 10).map((c) => (
                  <div className="table-row" role="row" key={c.idContrato}>
                    <span>{c.nombreEntidad}</span>
                    <span title={c.objetoDelContrato}>{(c.objetoDelContrato || '').slice(0, 60)}...</span>
                    <span>{c.proveedorAdjudicado}</span>
                    <span>{money(c.valorDelContrato)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </article>

      <aside className="detail-card">
        <p className="section-label">Proveedores más frecuentes</p>
        {e && e.proveedoresFrecuentes?.length > 0 ? (
          e.proveedoresFrecuentes.slice(0, 5).map((p) => (
            <p className="muted" key={p.nombre}>
              <strong>{p.nombre}</strong> — {p.contratos} contrato(s), {money(p.valorTotal)}
            </p>
          ))
        ) : (
          <p className="muted">Genera un estudio para ver proveedores frecuentes.</p>
        )}
      </aside>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
