/** "Encontrar oportunidades" con datos reales — reemplaza el mock del workspace de Empresas. */
const PRIORIDAD_TONO = { ALTA: 'alta', MEDIA: 'media', BAJA: 'baja' };
const PRIORIDAD_EMOJI = { ALTA: '🔥', MEDIA: '🟡', BAJA: '⚪' };

export default function BusinessWorkspace({ radar }) {
  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Compatibilidad comercial</p>
        <h2>Oportunidades abiertas para tu empresa</h2>

        <div className="filter-row" style={{ flexWrap: 'wrap', marginTop: 16 }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            <span>Nombre de tu empresa</span>
            <input value={radar.empresaNombre} onChange={(event) => radar.setEmpresaNombre(event.target.value)} />
          </label>
          <label>
            <span>Departamento donde quieres operar</span>
            <select value={radar.empresaDepartamento} onChange={(event) => radar.setEmpresaDepartamento(event.target.value)}>
              {radar.departamentosColombia.map((d) => (
                <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          <label style={{ flex: 1 }}>
            <span>¿Qué vendes? (lenguaje libre, sin códigos UNSPSC)</span>
            <input value={radar.empresaProductos} onChange={(event) => radar.setEmpresaProductos(event.target.value)} />
          </label>
        </div>
        <div className="filter-row">
          <label>
            <span>Desde</span>
            <input type="date" value={radar.empresaFechaDesde} onChange={(event) => radar.setEmpresaFechaDesde(event.target.value)} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" value={radar.empresaFechaHasta} onChange={(event) => radar.setEmpresaFechaHasta(event.target.value)} />
          </label>
          <button
            className="primary-button"
            type="button"
            onClick={radar.handleBuscarOportunidades}
            disabled={radar.empresaStatus === 'loading' || !radar.empresaNombre.trim()}
          >
            {radar.empresaStatus === 'loading' ? 'Buscando...' : 'Buscar oportunidades'}
          </button>
        </div>

        {radar.empresaSyncInfo && <p className="muted">{radar.empresaSyncInfo}</p>}
        {radar.empresaError && <p className="sigep-error">{radar.empresaError}</p>}

        {radar.oportunidades && (
          <>
            <h3 style={{ marginTop: 20 }}>{radar.oportunidades.length} oportunidades encontradas</h3>
            {radar.oportunidades.length === 0 && (
              <p className="muted">
                Ninguna compatible en {radar.empresaDepartamento} para ese rango de fechas — prueba ampliar el rango o
                describir tu producto con otras palabras.
              </p>
            )}
            <div className="data-table" role="table" aria-label="Oportunidades">
              <div className="table-row table-head" role="row">
                <span>Entidad</span>
                <span>Proceso</span>
                <span>Valor base</span>
                <span>Compatibilidad</span>
              </div>
              {radar.oportunidades.map((o) => (
                <div className="table-row" role="row" key={o.proceso.idProceso}>
                  <span>{o.proceso.entidad}</span>
                  <span title={o.proceso.nombreProcedimiento || o.proceso.descripcionProcedimiento}>
                    {(o.proceso.nombreProcedimiento || o.proceso.descripcionProcedimiento || '').slice(0, 60)}
                  </span>
                  <span>${Number(o.proceso.precioBase || 0).toLocaleString('es-CO')}</span>
                  <span>
                    <span className={`badge ${PRIORIDAD_TONO[o.prioridad] || 'nuevo'}`}>
                      {PRIORIDAD_EMOJI[o.prioridad]} {o.compatibilidad}%
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </article>

      <aside className="detail-card">
        <p className="section-label">Perfil detectado</p>
        {radar.empresaPerfil ? (
          <>
            <h3>Palabras clave</h3>
            <p className="muted">{radar.empresaPerfil.palabrasClave.join(', ')}</p>
          </>
        ) : (
          <p className="muted">Busca oportunidades para ver el perfil que RadarAI detecta de tu empresa.</p>
        )}
      </aside>
    </div>
  );
}
