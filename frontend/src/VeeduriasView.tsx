import { useEffect, useState } from 'react';
import {
  agregarComentario,
  crearVeeduria,
  listarVeedurias,
  marcarChecklist,
  obtenerEvidenciaDetalle,
  obtenerVeeduria,
  preguntarSobreDocumentos,
  subirDocumento,
  verificarSiri,
  verificarSigep,
  EvidenciaDetalle,
  SancionSiri,
  PuestoSensible,
  Veeduria,
} from './api';
import ContratoCard from './ContratoCard';
import Breadcrumbs from './components/navigation/Breadcrumbs';

function ListaVeedurias({ onAbrir, onNueva, onHome }: { onAbrir: (id: string) => void; onNueva: () => void; onHome: () => void }) {
  const [veedurias, setVeedurias] = useState<Veeduria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarVeedurias()
      .then(setVeedurias)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Inicio', onClick: onHome }, { label: 'Veedurías' }]} />
      <h1 className="view-title">🔍 Veedurías</h1>
      <p className="view-subtitle">Investigaciones colectivas sobre contratación pública, organizadas por ciudadanos.</p>
      <button onClick={onNueva} style={{ marginTop: 12 }}>+ Nueva veeduría</button>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {!veedurias && !error && <p>Cargando…</p>}
      {veedurias && veedurias.length === 0 && <p>Todavía no hay veedurías creadas.</p>}

      <div style={{ marginTop: 16 }}>
        {veedurias?.map((v) => (
          <div
            key={v._id}
            onClick={() => onAbrir(v._id)}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8, cursor: 'pointer' }}
          >
            <strong>{v.titulo}</strong> — <span style={{ color: v.estado === 'ABIERTA' ? 'green' : '#888' }}>{v.estado}</span>
            <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>
              {[v.ciudad, v.departamento].filter(Boolean).join(', ')} {v.tema && `· ${v.tema}`}
            </p>
            <p style={{ fontSize: 13, color: '#888' }}>
              {v.hallazgos.length} hallazgo(s) · {v.comentarios.length} comentario(s) · {v.checklist.filter((c) => c.hecho).length}/{v.checklist.length} checklist
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NuevaVeeduria({ onCreada, onCancelar, onHome }: { onCreada: (id: string) => void; onCancelar: () => void; onHome: () => void }) {
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
    <div>
      <Breadcrumbs items={[{ label: 'Inicio', onClick: onHome }, { label: 'Veedurías', onClick: onCancelar }, { label: 'Nueva veeduría' }]} />
      <h1>+ Nueva veeduría</h1>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <label>Título <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={{ width: '100%' }} /></label>
        <label>Descripción <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} style={{ width: '100%' }} /></label>
        <label>Departamento <input value={departamento} onChange={(e) => setDepartamento(e.target.value)} /></label>
        <label>Ciudad <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} /></label>
        <label>Tema <input value={tema} onChange={(e) => setTema(e.target.value)} style={{ width: '100%' }} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={handleCrear} disabled={cargando || !titulo.trim()}>{cargando ? 'Creando…' : 'Crear veeduría'}</button>
        <button onClick={onCancelar} style={{ background: 'transparent', color: 'var(--radar-olive)', border: '1px solid var(--radar-olive)' }}>Cancelar</button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

function DetalleVeeduria({ id, onVolver, onHome }: { id: string; onVolver: () => void; onHome: () => void }) {
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

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!v) return <p>Cargando…</p>;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Inicio', onClick: onHome },
          { label: 'Veedurías', onClick: onVolver },
          { label: v.titulo },
        ]}
      />
      <h1>{v.titulo}</h1>
      <p style={{ color: '#555' }}>{v.descripcion}</p>
      <p style={{ fontSize: 14, color: '#888' }}>
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

export default function VeeduriasView({ abrirId, onAbierta, onHome }: { abrirId?: string | null; onAbierta?: () => void; onHome?: () => void } = {}) {
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
    return <NuevaVeeduria onCreada={(id) => setVista({ modo: 'detalle', id })} onCancelar={() => setVista({ modo: 'lista' })} onHome={onHome!} />;
  }
  if (vista.modo === 'detalle') {
    return <DetalleVeeduria id={vista.id} onVolver={() => setVista({ modo: 'lista' })} onHome={onHome!} />;
  }
  return <ListaVeedurias onAbrir={(id) => setVista({ modo: 'detalle', id })} onNueva={() => setVista({ modo: 'nueva' })} onHome={onHome!} />;
}
import React from 'react';
