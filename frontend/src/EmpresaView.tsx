import { useMemo, useState } from 'react';
import { crearEmpresa, oportunidadesParaEmpresa, sincronizar, Empresa, Oportunidad } from './api';
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

const PRIORIDAD_COLOR: Record<string, string> = { ALTA: '#e6f7e6', MEDIA: '#fff8e6', BAJA: '#f4f4f4' };
const PRIORIDAD_EMOJI: Record<string, string> = { ALTA: '🔥', MEDIA: '🟡', BAJA: '⚪' };

export default function EmpresaView() {
  const [nombre, setNombre] = useState('');
  const [productosServicios, setProductosServicios] = useState(
    'Vendemos computadores empresariales, servidores y soluciones de infraestructura tecnológica.',
  );
  const [departamento, setDepartamento] = useState('Cundinamarca');
  const ciudadesDisponibles = useMemo(
    () => DEPARTAMENTOS.find((d) => d.departamento === departamento)?.ciudades ?? [],
    [departamento],
  );
  const [fechaDesde, setFechaDesde] = useState(haceUnAno());
  const [fechaHasta, setFechaHasta] = useState(hoy());

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidad[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);

  async function handleBuscarOportunidades() {
    setCargando(true);
    setError(null);
    setOportunidades(null);
    try {
      // 1. Crea (o re-crea) el perfil de la empresa — genera palabrasClave automáticamente.
      const emp = await crearEmpresa({ nombre, productosServicios, departamentos: [departamento] });
      setEmpresa(emp);

      // 2. Trae procesos abiertos recientes del departamento (mismo dataset que usa el flujo ciudadano).
      const r = await sincronizar({ departamento, fechaDesde, fechaHasta });
      setSyncInfo(`Procesos revisados en ${departamento} (${fechaDesde} a ${fechaHasta}): ${r.procesos}.`);

      // 3. Calcula compatibilidad contra los procesos ya en Mongo.
      const ops = await oportunidadesParaEmpresa(emp._id);
      setOportunidades(ops);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>💼 Encontrar oportunidades</h1>
      <p style={{ color: '#555' }}>Encontrá oportunidades de contratación pública compatibles con lo que vendés.</p>

      <div style={{ display: 'grid', gap: 8, marginTop: 24 }}>
        <label>Nombre de tu empresa <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ width: '100%' }} /></label>
        <label>
          ¿Qué vendés? (lenguaje libre, sin necesidad de saber códigos UNSPSC)
          <textarea value={productosServicios} onChange={(e) => setProductosServicios(e.target.value)} rows={2} style={{ width: '100%' }} />
        </label>
        <BotonUbicacion
          onSugerir={(d) => {
            if (DEPARTAMENTOS.some((x) => x.departamento === d)) setDepartamento(d);
          }}
        />
        <label>
          Departamento donde querés operar{' '}
          <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
            {DEPARTAMENTOS.map((d) => (
              <option key={d.departamento} value={d.departamento}>
                {d.departamento}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label>Desde <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></label>
          <label>Hasta <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></label>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={handleBuscarOportunidades} disabled={cargando || !nombre.trim()}>
          {cargando ? 'Buscando…' : 'Buscar oportunidades'}
        </button>
      </div>

      {syncInfo && <p style={{ color: 'green' }}>{syncInfo}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {empresa && (
        <p style={{ marginTop: 12, fontSize: 13, color: '#555' }}>
          Perfil detectado: <strong>{empresa.palabrasClave.join(', ')}</strong>
        </p>
      )}

      {oportunidades && (
        <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <h2>🔎 {oportunidades.length} oportunidades encontradas</h2>
          {oportunidades.length === 0 && (
            <p>Ninguna compatible en {departamento} para ese rango de fechas — probá ampliar el rango o describir tu producto con otras palabras.</p>
          )}
          {oportunidades.map((o) => (
            <div
              key={o.proceso.idProceso}
              style={{ background: PRIORIDAD_COLOR[o.prioridad], border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 10 }}
            >
              <strong>
                {PRIORIDAD_EMOJI[o.prioridad]} {o.proceso.entidad} — Compatibilidad: {o.compatibilidad}%
              </strong>
              <p style={{ margin: '6px 0' }}>{o.proceso.nombreProcedimiento || o.proceso.descripcionProcedimiento}</p>
              <p style={{ fontSize: 13, color: '#555' }}>
                {o.proceso.ciudadEntidad}, {o.proceso.departamentoEntidad} · Valor base: ${o.proceso.precioBase.toLocaleString('es-CO')} ·{' '}
                Competencia: {o.competencia} · {o.proceso.modalidadContratacion}
              </p>
              <details>
                <summary>¿Por qué?</summary>
                <ul>
                  {o.porQue.map((p, i) => (
                    <li key={i}>✓ {p}</li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
