import { useMemo, useState } from 'react';
import { consultar, crearVeeduria, sincronizar, ConsultaResultado, Hallazgo } from './api';
import colombia from './colombia.json';
import BotonUbicacion from './BotonUbicacion';

interface DeptoColombia {
  departamento: string;
  ciudades: string[];
}
const DEPARTAMENTOS = colombia as DeptoColombia[];

function haceUnAno(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CiudadanoView({ onRevisar }: { onRevisar: (veeduriaId: string) => void }) {
  const [departamento, setDepartamento] = useState('Cundinamarca');
  const [ciudad, setCiudad] = useState('Tocancipá');
  const ciudadesDisponibles = useMemo(
    () => DEPARTAMENTOS.find((d) => d.departamento === departamento)?.ciudades ?? [],
    [departamento],
  );
  const [tema, setTema] = useState('mantenimiento de colegios');
  const [pregunta, setPregunta] = useState('¿Cuánto ha gastado el municipio en mantenimiento de colegios este año?');
  const [fechaDesde, setFechaDesde] = useState(haceUnAno());
  const [fechaHasta, setFechaHasta] = useState(hoy());
  const [cargandoSync, setCargandoSync] = useState(false);
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConsultaResultado | null>(null);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);
  const [creandoVeeduria, setCreandoVeeduria] = useState<number | null>(null);

  async function handleRevisar(hallazgo: Hallazgo, indice: number) {
    setCreandoVeeduria(indice);
    setError(null);
    try {
      const v = await crearVeeduria({
        titulo: `${hallazgo.titulo} — ${[ciudad, departamento].filter(Boolean).join(', ')}`,
        descripcion: hallazgo.detalle,
        departamento,
        ciudad,
        tema,
        contratosVinculados: hallazgo.evidencia.map((e) => e.id),
      });
      onRevisar(v._id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreandoVeeduria(null);
    }
  }

  async function handleSync() {
    setCargandoSync(true);
    setError(null);
    try {
      const r = await sincronizar({ departamento, ciudad, tema, fechaDesde, fechaHasta });
      setSyncInfo(`Traídos de SECOP (${fechaDesde} a ${fechaHasta}): ${r.procesos} procesos, ${r.contratos} contratos.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargandoSync(false);
    }
  }

  async function handleConsultar() {
    setCargandoConsulta(true);
    setError(null);
    setResultado(null);
    try {
      const r = await consultar({ departamento, ciudad, tema, pregunta, fechaDesde, fechaHasta });
      setResultado(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargandoConsulta(false);
    }
  }

  return (
    <div>
      <h1>🏛️ RADAR — demo ciudadano</h1>
      <p style={{ color: '#555' }}>Inteligencia pública sobre contratación estatal, con datos reales de SECOP II (datos.gov.co).</p>

      <div style={{ display: 'grid', gap: 8, marginTop: 24 }}>
        <BotonUbicacion
          onSugerir={(d, c) => {
            // colombia.json y colombiaCoords.ts vienen de fuentes distintas — validar que el
            // departamento sugerido exista en el selector antes de aplicarlo, si no, no cambiar nada.
            const depto = DEPARTAMENTOS.find((x) => x.departamento === d);
            if (!depto) return;
            setDepartamento(d);
            setCiudad(depto.ciudades.includes(c) ? c : depto.ciudades[0]);
          }}
        />
        <label>
          Departamento{' '}
          <select
            value={departamento}
            onChange={(e) => {
              setDepartamento(e.target.value);
              setCiudad(DEPARTAMENTOS.find((d) => d.departamento === e.target.value)?.ciudades[0] ?? '');
            }}
          >
            {DEPARTAMENTOS.map((d) => (
              <option key={d.departamento} value={d.departamento}>
                {d.departamento}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ciudad/Municipio{' '}
          <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            {ciudadesDisponibles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>Tema <input value={tema} onChange={(e) => setTema(e.target.value)} style={{ width: '100%' }} /></label>
        <label>Pregunta <textarea value={pregunta} onChange={(e) => setPregunta(e.target.value)} rows={2} style={{ width: '100%' }} /></label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label>Desde <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></label>
          <label>Hasta <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={handleSync} disabled={cargandoSync}>{cargandoSync ? 'Trayendo de SECOP…' : '1. Sincronizar datos de SECOP'}</button>
        <button onClick={handleConsultar} disabled={cargandoConsulta}>{cargandoConsulta ? 'Analizando…' : '2. Preguntar'}</button>
      </div>

      {syncInfo && <p style={{ color: 'green' }}>{syncInfo}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {resultado && (
        <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <h2>🏫 {resultado.resumen.territorio}</h2>
          <p>
            ${resultado.resumen.valorTotalContratado.toLocaleString('es-CO')} contratados · {resultado.resumen.totalContratos} contratos ·{' '}
            {resultado.resumen.proveedoresUnicos} proveedores
          </p>
          <p style={{ fontStyle: 'italic' }}>{resultado.respuesta}</p>

          {resultado.hallazgos.length > 0 && (
            <>
              <h3>Encontramos {resultado.hallazgos.length} aspecto(s) que pueden ser relevantes para una veeduría</h3>
              {resultado.hallazgos.map((h, i) => (
                <div key={i} style={{ background: '#fff8e6', border: '1px solid #f0d68a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <strong>{h.severidad === 'ALTA' ? '🔴' : '🟠'} {h.titulo}</strong>
                  <p>{h.detalle}</p>
                  <details>
                    <summary>¿Cómo lo sabemos?</summary>
                    <ul>
                      {h.evidencia.map((e, j) => (
                        <li key={j}>
                          {e.entidad} — {e.id}{' '}
                          {e.link && (
                            <a href={e.link} target="_blank" rel="noreferrer">
                              ver proceso original en SECOP
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                  <button onClick={() => handleRevisar(h, i)} disabled={creandoVeeduria === i} style={{ marginTop: 8 }}>
                    {creandoVeeduria === i ? 'Creando veeduría…' : 'Revisar →'}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
