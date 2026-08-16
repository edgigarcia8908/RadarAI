import { useEffect, useState } from 'react';
import {
  agregarComentario,
  consultar,
  crearVeeduria,
  listarVeedurias,
  marcarChecklist,
  obtenerEvidenciaDetalle,
  obtenerVeeduria,
  preguntarSobreDocumentos,
  sincronizar,
  subirDocumento,
  verificarSiri,
  verificarSigep,
  vincularEvidencia,
  EvidenciaDetalle,
  SancionSiri,
  PuestoSensible,
  Veeduria,
} from './api';
import type { ContratoInfo } from './contratoUtils';
import ContratoCard from './ContratoCard';

function ListaVeedurias({ onAbrir, onNueva }: { onAbrir: (id: string) => void; onNueva: () => void }) {
  const [veedurias, setVeedurias] = useState<Veeduria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarVeedurias()
      .then(setVeedurias)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="oversight-view">
      <div className="oversight-header">
        <div>
          <span className="view-eyebrow">Participación ciudadana</span>
          <h1>Veedurías</h1>
          <p>Organiza investigaciones colectivas y sigue las evidencias de la contratación pública.</p>
        </div>
        <button className="oversight-primary-button" onClick={onNueva} type="button">+ Nueva veeduría</button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!veedurias && !error && <p className="view-loading">Cargando...</p>}
      {veedurias && veedurias.length === 0 && (
        <div className="oversight-empty-state">
          <span className="oversight-empty-icon">+</span>
          <strong>Aún no hay veedurías creadas</strong>
          <span>Crea una investigación para reunir hallazgos, documentos y comentarios en un solo lugar.</span>
          <button className="oversight-secondary-button" onClick={onNueva} type="button">Crear la primera veeduría</button>
        </div>
      )}

      <div className="oversight-list">
        {veedurias?.map((v) => (
          <div
            className="oversight-card"
            key={v._id}
            onClick={() => onAbrir(v._id)}
          >
            <div className="oversight-card-title"><strong>{v.titulo}</strong><span className={`oversight-status oversight-status-${v.estado.toLowerCase()}`}>{v.estado}</span></div>
            <p className="oversight-card-location">
              {[v.ciudad, v.departamento].filter(Boolean).join(', ')} {v.tema && `· ${v.tema}`}
            </p>
            <p className="oversight-card-meta">
              {v.hallazgos.length} hallazgo(s) · {v.comentarios.length} comentario(s) · {v.checklist.filter((c) => c.hecho).length}/{v.checklist.length} checklist
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NuevaVeeduria({ onCreada, onCancelar }: { onCreada: (id: string) => void; onCancelar: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [tema, setTema] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCrear() {
    setCargando(true);
    setError(null);
    try {
      const v = await crearVeeduria({ titulo, descripcion, departamento, ciudad, tema });
      onCreada(v._id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="oversight-view oversight-form-view">
      <div className="oversight-header oversight-header-stacked">
        <div>
          <span className="view-eyebrow">Nueva investigación</span>
          <h1>Crear una veeduría</h1>
          <p>Define el territorio y el tema que quieres vigilar junto con tu comunidad.</p>
        </div>
      </div>
      <div className="oversight-form-grid">
        <label>Título <input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label>
        <label>Descripción <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} /></label>
        <label>Departamento <input value={departamento} onChange={(e) => setDepartamento(e.target.value)} /></label>
        <label>Ciudad <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} /></label>
        <label>Tema <input value={tema} onChange={(e) => setTema(e.target.value)} /></label>
      </div>
      <div className="oversight-form-actions">
        <button className="oversight-primary-button" onClick={handleCrear} disabled={cargando || !titulo.trim()} type="button">{cargando ? 'Creando...' : 'Crear veeduría'}</button>
        <button className="oversight-secondary-button" onClick={onCancelar} type="button">Cancelar</button>
      </div>
      {error && <p className="view-error">{error}</p>}
    </div>
  );
}

function DetalleVeeduria({ id, onVolver }: { id: string; onVolver: () => void }) {
  const [v, setV] = useState<Veeduria | null>(null);
  const [evidencia, setEvidencia] = useState<EvidenciaDetalle | null>(null);
  const [sanciones, setSanciones] = useState<Record<string, SancionSiri[]>>({});
  const [puestosSensibles, setPuestosSensibles] = useState<Record<string, PuestoSensible[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [autor, setAutor] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [preguntando, setPreguntando] = useState(false);

  // Buscador de contratos reales para vincular como evidencia — antes la
  // única forma de tener evidencia era que ya viniera vinculada desde
  // afuera; no existía ninguna forma de buscar y agregar un contrato real
  // desde esta pantalla.
  const [temaBusqueda, setTemaBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ContratoInfo[] | null>(null);
  const [buscandoContratos, setBuscandoContratos] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [vinculandoId, setVinculandoId] = useState<string | null>(null);

  function recargar() {
    obtenerVeeduria(id).then(setV).catch((e) => setError(e.message));
    obtenerEvidenciaDetalle(id).then((ev) => {
      setEvidencia(ev);
      const nombresFirmantes = [...new Set(ev.contratos.flatMap((c) => [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto]).filter((n): n is string => !!n))];
      verificarSiri(nombresFirmantes).then(setSanciones).catch(() => {});
      const nombresServidores = [...new Set(ev.contratos.flatMap((c) => [c.nombreOrdenadorDelGasto, c.nombreSupervisor]).filter((n): n is string => !!n))];
      verificarSigep(nombresServidores).then(setPuestosSensibles).catch(() => {});
    }).catch(() => {});
  }
  useEffect(recargar, [id]);

  async function handleComentar() {
    if (!nuevoComentario.trim() || !autor.trim()) return;
    await agregarComentario(id, autor, nuevoComentario);
    setNuevoComentario('');
    recargar();
  }

  async function handleChecklist(indice: number, hecho: boolean) {
    await marcarChecklist(id, indice, hecho);
    recargar();
  }

  async function handleSubirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setError(null);
    try {
      await subirDocumento(id, file, autor || 'anónimo');
      recargar();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  }

  async function handlePreguntar() {
    if (!pregunta.trim()) return;
    setPreguntando(true);
    setRespuesta(null);
    try {
      const r = await preguntarSobreDocumentos(id, pregunta);
      setRespuesta(r.answer);
    } catch (err: any) {
      setRespuesta(`Error: ${err.message}`);
    } finally {
      setPreguntando(false);
    }
  }

  async function handleBuscarContratos() {
    if (!v) return;
    setBuscandoContratos(true);
    setErrorBusqueda(null);
    setResultadosBusqueda(null);
    try {
      // Sincroniza primero — sin esto, la búsqueda solo mira lo que ya
      // estaba en Mongo de antes, que puede ser una fracción vieja de lo
      // real en SECOP (mismo problema resuelto antes en Comparar
      // proveedores).
      await sincronizar({ departamento: v.departamento, ciudad: v.ciudad, tema: temaBusqueda });
      const r = await consultar({
        departamento: v.departamento,
        ciudad: v.ciudad,
        tema: temaBusqueda,
        pregunta: temaBusqueda || `Contratos de ${v.ciudad}`,
      });
      setResultadosBusqueda(r.evidenciaContratos);
    } catch (err: any) {
      setErrorBusqueda(err.message);
    } finally {
      setBuscandoContratos(false);
    }
  }

  async function handleVincular(contratoId: string) {
    setVinculandoId(contratoId);
    try {
      await vincularEvidencia(id, { contratoId });
      recargar();
    } catch (err: any) {
      setErrorBusqueda(err.message);
    } finally {
      setVinculandoId(null);
    }
  }

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!v) return <p>Cargando…</p>;

  return (
    <div className="oversight-view oversight-detail">
      <button className="oversight-back-button" onClick={onVolver} type="button">
        ← Todas las veedurías
      </button>
      <div className="oversight-detail-header">
        <span className="view-eyebrow">Investigación ciudadana</span>
        <h1>{v.titulo}</h1>
        <p>{v.descripcion}</p>
      </div>
      <p className="oversight-card-location">
        {[v.ciudad, v.departamento].filter(Boolean).join(', ')} {v.tema && `· ${v.tema}`}
      </p>

      <h3>Checklist de investigación</h3>
      {v.checklist.map((c, i) => (
        <label key={i} style={{ display: 'block', margin: '4px 0' }}>
          <input type="checkbox" checked={c.hecho} onChange={(e) => handleChecklist(i, e.target.checked)} /> {c.texto}
        </label>
      ))}

      <h3>Hallazgos ({v.hallazgos.length})</h3>
      {v.hallazgos.length === 0 && <p style={{ color: '#888' }}>Ninguno todavía.</p>}
      {v.hallazgos.map((h, i) => (
        <div key={i} style={{ background: '#fff8e6', border: '1px solid #f0d68a', borderRadius: 8, padding: 10, marginBottom: 6 }}>
          <strong>{h.titulo}</strong>
          <p style={{ margin: '4px 0' }}>{h.detalle}</p>
          <p style={{ fontSize: 12, color: '#888' }}>{h.autor}</p>
        </div>
      ))}

      <h3>Evidencia ({(evidencia?.procesos.length ?? 0) + (evidencia?.contratos.length ?? 0)})</h3>
      {evidencia && evidencia.contratos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {evidencia.contratos.map((c) => (
            <ContratoCard key={c.idContrato} c={c} sanciones={sanciones} puestosSensibles={puestosSensibles} />
          ))}
        </div>
      )}

      <div className="oversight-search">
        <h4>Buscar contratos reales para vincular como evidencia</h4>
        <p className="oversight-search-hint">
          Busca en SECOP dentro de {[v.ciudad, v.departamento].filter(Boolean).join(', ')} — sincroniza los datos
          más recientes antes de mostrar resultados.
        </p>
        <div className="oversight-search-form">
          <input
            onChange={(e) => setTemaBusqueda(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleBuscarContratos(); }}
            placeholder="Tema, ej. mantenimiento de vías"
            value={temaBusqueda}
          />
          <button
            className="oversight-secondary-button"
            disabled={buscandoContratos}
            onClick={handleBuscarContratos}
            type="button"
          >
            {buscandoContratos ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {errorBusqueda && <p className="view-error">{errorBusqueda}</p>}

        {resultadosBusqueda && resultadosBusqueda.length === 0 && (
          <p style={{ color: '#888' }}>Ningún contrato coincide con esa búsqueda en lo ya sincronizado.</p>
        )}

        {resultadosBusqueda && resultadosBusqueda.length > 0 && (
          <div>
            {resultadosBusqueda.map((c) => {
              const yaVinculado = v.contratosVinculados.includes(c.idContrato);
              return (
                <div className="oversight-search-result" key={c.idContrato}>
                  <ContratoCard c={c} sanciones={sanciones} puestosSensibles={puestosSensibles} />
                  <button
                    className={`oversight-secondary-button${yaVinculado ? ' oversight-vincular-hecho' : ''}`}
                    disabled={yaVinculado || vinculandoId === c.idContrato}
                    onClick={() => handleVincular(c.idContrato)}
                    type="button"
                  >
                    {yaVinculado ? '✓ Ya vinculado' : vinculandoId === c.idContrato ? 'Vinculando…' : '+ Vincular a esta veeduría'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 6, padding: 10 }}>
        Al hacer clic en "Revisar →" se abre SECOP en una pestaña nueva. SECOP pide confirmar que "no eres un robot" —
        eso lo tienes que pasar tú. Una vez adentro, busca el documento que te interese (pliegos, estudios previos, contrato
        firmado) y descárgalo. Vuelve aquí y súbelo abajo en "Documentos": por el bloqueo de SECOP no podemos traerlo
        automáticamente, pero desde que lo subes, RadarAI sí lo analiza solo.
      </p>

      <h3>Documentos ({v.documentos.length})</h3>
      {v.documentos.map((d, i) => (
        <div key={i} style={{ border: '1px solid #eee', borderRadius: 6, padding: 8, marginBottom: 6 }}>
          <a href={d.url} target="_blank" rel="noreferrer">{d.nombre}</a> — subido por {d.subidoPor}{' '}
          {d.indexado ? <span style={{ color: 'green' }}>· indexado ✓</span> : <span style={{ color: '#b58900' }}> · sin indexar ({d.motivoNoIndexado})</span>}
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <input type="file" accept="application/pdf" onChange={handleSubirArchivo} disabled={subiendo} />
        {subiendo && <span style={{ marginLeft: 8 }}>Subiendo…</span>}
      </div>

      {v.documentos.some((d) => d.indexado) && (
        <div style={{ marginTop: 12 }}>
          <label>
            Preguntar sobre los documentos indexados{' '}
            <input value={pregunta} onChange={(e) => setPregunta(e.target.value)} style={{ width: 300 }} />
          </label>
          <button onClick={handlePreguntar} disabled={preguntando} style={{ marginLeft: 8 }}>
            {preguntando ? 'Buscando…' : 'Preguntar'}
          </button>
          {respuesta && <p style={{ fontStyle: 'italic', marginTop: 8 }}>{respuesta}</p>}
        </div>
      )}

      <h3>Comentarios ({v.comentarios.length})</h3>
      {v.comentarios.map((c, i) => (
        <div key={i} style={{ borderBottom: '1px solid #eee', padding: '6px 0' }}>
          <strong>{c.autor}</strong>: {c.texto}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input placeholder="Tu nombre/email" value={autor} onChange={(e) => setAutor(e.target.value)} style={{ width: 160 }} />
        <input placeholder="Comentario…" value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)} style={{ flex: 1 }} />
        <button onClick={handleComentar}>Enviar</button>
      </div>
    </div>
  );
}

export default function VeeduriasView({ abrirId, onAbierta }: { abrirId?: string | null; onAbierta?: () => void } = {}) {
  const [vista, setVista] = useState<{ modo: 'lista' } | { modo: 'nueva' } | { modo: 'detalle'; id: string }>(
    abrirId ? { modo: 'detalle', id: abrirId } : { modo: 'lista' },
  );

  useEffect(() => {
    if (abrirId) {
      setVista({ modo: 'detalle', id: abrirId });
      onAbierta?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirId]);

  if (vista.modo === 'nueva') {
    return <NuevaVeeduria onCreada={(id) => setVista({ modo: 'detalle', id })} onCancelar={() => setVista({ modo: 'lista' })} />;
  }
  if (vista.modo === 'detalle') {
    return <DetalleVeeduria id={vista.id} onVolver={() => setVista({ modo: 'lista' })} />;
  }
  return <ListaVeedurias onAbrir={(id) => setVista({ modo: 'detalle', id })} onNueva={() => setVista({ modo: 'nueva' })} />;
}
import React from 'react';
