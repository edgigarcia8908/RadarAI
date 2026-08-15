import { useEffect, useState } from 'react';
import { agregarComentario, crearVeeduria, listarVeedurias, marcarChecklist, obtenerVeeduria, Veeduria } from './api';

function ListaVeedurias({ onAbrir, onNueva }: { onAbrir: (id: string) => void; onNueva: () => void }) {
  const [veedurias, setVeedurias] = useState<Veeduria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarVeedurias()
      .then(setVeedurias)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>🔍 Veedurías</h1>
      <p style={{ color: '#555' }}>Investigaciones colectivas sobre contratación pública, organizadas por ciudadanos.</p>
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
    <div>
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
        <button onClick={onCancelar} style={{ background: 'transparent', color: '#1a2b6d', border: '1px solid #1a2b6d' }}>Cancelar</button>
      </div>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
    </div>
  );
}

function DetalleVeeduria({ id, onVolver }: { id: string; onVolver: () => void }) {
  const [v, setV] = useState<Veeduria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [autor, setAutor] = useState('');

  function recargar() {
    obtenerVeeduria(id).then(setV).catch((e) => setError(e.message));
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

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!v) return <p>Cargando…</p>;

  return (
    <div>
      <button onClick={onVolver} style={{ marginBottom: 12, background: 'transparent', color: '#1a2b6d', border: '1px solid #1a2b6d' }}>
        ← Todas las veedurías
      </button>
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

export default function VeeduriasView() {
  const [vista, setVista] = useState<{ modo: 'lista' } | { modo: 'nueva' } | { modo: 'detalle'; id: string }>({ modo: 'lista' });

  if (vista.modo === 'nueva') {
    return <NuevaVeeduria onCreada={(id) => setVista({ modo: 'detalle', id })} onCancelar={() => setVista({ modo: 'lista' })} />;
  }
  if (vista.modo === 'detalle') {
    return <DetalleVeeduria id={vista.id} onVolver={() => setVista({ modo: 'lista' })} />;
  }
  return <ListaVeedurias onAbrir={(id) => setVista({ modo: 'detalle', id })} onNueva={() => setVista({ modo: 'nueva' })} />;
}
