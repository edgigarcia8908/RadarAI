import { useEffect } from 'react';

/** Veedurias con datos reales — CRUD completo, reemplaza el mock del workspace de Control social. */
function money(valor) {
  return `$${Number(valor || 0).toLocaleString('es-CO')}`;
}

export default function OversightWorkspace({ radar }) {
  useEffect(() => {
    if (radar.veeduriasStatus === 'idle') radar.handleCargarVeedurias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (radar.veeduriaActivaId && radar.veeduriaActiva) {
    return <VeeduriaDetalle radar={radar} />;
  }

  return <VeeduriaLista radar={radar} />;
}

function VeeduriaLista({ radar }) {
  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Veeduria activa</p>
        <h2>Veedurías ciudadanas</h2>
        <p className="muted">
          Se crean desde un hallazgo en "Vigilar mi territorio", o consultando directamente la lista de las ya
          existentes.
        </p>

        {radar.veeduriasStatus === 'loading' && <p className="muted">Cargando...</p>}
        {radar.veeduriaError && <p className="sigep-error">{radar.veeduriaError}</p>}
        {radar.veeduriasStatus === 'success' && radar.veedurias.length === 0 && (
          <p className="muted">Todavía no hay veedurías creadas — crea una desde un hallazgo en "Vigilar mi territorio".</p>
        )}

        <div className="data-table" role="table" aria-label="Veedurías">
          <div className="table-row table-head" role="row">
            <span>Título</span>
            <span>Territorio</span>
            <span>Hallazgos</span>
            <span>Estado</span>
          </div>
          {radar.veedurias.map((v) => (
            <div className="table-row" role="row" key={v._id} onClick={() => radar.handleAbrirVeeduria(v._id)} style={{ cursor: 'pointer' }}>
              <span>{v.titulo}</span>
              <span>{[v.ciudad, v.departamento].filter(Boolean).join(', ')}</span>
              <span>{v.hallazgos.length}</span>
              <span><span className={v.estado === 'ABIERTA' ? 'badge nuevo' : 'badge pagado'}>{v.estado}</span></span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function VeeduriaDetalle({ radar }) {
  const v = radar.veeduriaActiva;
  const ev = radar.veeduriaEvidencia;

  return (
    <div className="content-grid">
      <article className="detail-card large">
        <button className="secondary-button" type="button" onClick={() => radar.handleAbrirVeeduria(null)}>
          ← Todas las veedurías
        </button>
        <p className="section-label">Veeduria activa</p>
        <h2>{v.titulo}</h2>
        <p className="muted">{v.descripcion}</p>

        <h3>Checklist de investigación</h3>
        <div className="checklist">
          {v.checklist.map((c, i) => (
            <label key={i}>
              <input type="checkbox" checked={c.hecho} onChange={(event) => radar.handleChecklistVeeduria(i, event.target.checked)} />
              <span>{c.texto}</span>
            </label>
          ))}
        </div>

        <h3>Hallazgos ({v.hallazgos.length})</h3>
        {v.hallazgos.map((h, i) => (
          <div className="alert-item warning" key={i}>
            <strong>{h.titulo}</strong>
            <p>{h.detalle}</p>
          </div>
        ))}

        {ev && ev.contratos.length > 0 && (
          <>
            <h3>Evidencia ({ev.procesos.length + ev.contratos.length})</h3>
            <div className="data-table compact" role="table" aria-label="Evidencia">
              <div className="table-row table-head" role="row">
                <span>Entidad</span>
                <span>Proveedor</span>
                <span>Valor</span>
                <span>SECOP</span>
              </div>
              {ev.contratos.map((c) => (
                <div className="table-row" role="row" key={c.idContrato}>
                  <span>{c.nombreEntidad}</span>
                  <span>{c.proveedorAdjudicado}</span>
                  <span>{money(c.valorDelContrato)}</span>
                  <span>{c.urlProceso ? <a href={c.urlProceso} target="_blank" rel="noreferrer">Ver →</a> : '—'}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h3>Documentos ({v.documentos.length})</h3>
        {v.documentos.map((d, i) => (
          <p className="muted" key={i}>
            <a href={d.url} target="_blank" rel="noreferrer">{d.nombre}</a> — subido por {d.subidoPor}{' '}
            {d.indexado ? '· indexado ✓' : `· sin indexar (${d.motivoNoIndexado})`}
          </p>
        ))}
        <div className="filter-row">
          <label>
            <span>Tu nombre</span>
            <input value={radar.veeduriaAutor} onChange={(event) => radar.setVeeduriaAutor(event.target.value)} />
          </label>
          <input
            type="file"
            accept="application/pdf"
            disabled={radar.veeduriaSubiendo}
            onChange={(event) => radar.handleSubirDocumentoVeeduria(event.target.files?.[0])}
          />
        </div>

        {v.documentos.some((d) => d.indexado) && (
          <div style={{ marginTop: 12 }}>
            <div className="filter-row">
              <label style={{ flex: 1 }}>
                <span>Preguntar sobre los documentos indexados</span>
                <input value={radar.veeduriaPregunta} onChange={(event) => radar.setVeeduriaPregunta(event.target.value)} />
              </label>
              <button className="secondary-button" type="button" onClick={radar.handlePreguntarVeeduria} disabled={radar.veeduriaPreguntando}>
                {radar.veeduriaPreguntando ? 'Buscando...' : 'Preguntar'}
              </button>
            </div>
            {radar.veeduriaRespuesta && <p className="muted">{radar.veeduriaRespuesta}</p>}
          </div>
        )}

        <h3>Comentarios ({v.comentarios.length})</h3>
        {v.comentarios.map((c, i) => (
          <p key={i}><strong>{c.autor}</strong>: {c.texto}</p>
        ))}
        <div className="filter-row">
          <label>
            <span>Tu nombre</span>
            <input value={radar.veeduriaAutor} onChange={(event) => radar.setVeeduriaAutor(event.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            <span>Comentario</span>
            <input value={radar.veeduriaComentario} onChange={(event) => radar.setVeeduriaComentario(event.target.value)} />
          </label>
          <button className="primary-button" type="button" onClick={radar.handleComentarVeeduria}>Enviar</button>
        </div>
      </article>
    </div>
  );
}
