import { useMemo, useState } from 'react';
import { generarEstudioMercado, sincronizar, EstudioMercado } from './api';
import colombia from './colombia.json';
import BotonUbicacion from './BotonUbicacion';

interface DeptoColombia {
  departamento: string;
  ciudades: string[];
}
const DEPARTAMENTOS = colombia as DeptoColombia[];

function haceUnAno(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return d.toISOString().slice(0, 10);
}
function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EstudioMercadoView() {
  const [objeto, setObjeto] = useState('mantenimiento de vías');
  const [departamento, setDepartamento] = useState('Cundinamarca');
  const [ciudad, setCiudad] = useState('');
  const ciudadesDisponibles = useMemo(
    () => DEPARTAMENTOS.find((d) => d.departamento === departamento)?.ciudades ?? [],
    [departamento],
  );
  const [fechaDesde, setFechaDesde] = useState(haceUnAno());
  const [fechaHasta, setFechaHasta] = useState(hoy());
  const [cargandoSync, setCargandoSync] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [syncInfo, setSyncInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estudio, setEstudio] = useState<EstudioMercado | null>(null);

  async function handleSync() {
    setCargandoSync(true);
    setError(null);
    try {
      const r = await sincronizar({ departamento, ciudad: ciudad || undefined, tema: objeto, fechaDesde, fechaHasta });
      setSyncInfo(`Traídos de SECOP: ${r.procesos} procesos, ${r.contratos} contratos.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargandoSync(false);
    }
  }

  async function handleGenerar() {
    setCargando(true);
    setError(null);
    setEstudio(null);
    try {
      const r = await generarEstudioMercado({ objeto, departamento, ciudad: ciudad || undefined, fechaDesde, fechaHasta });
      setEstudio(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>🏛️ Estudio de mercado</h1>
      <p style={{ color: '#555' }}>
        Para entidades públicas: antes de sacar un proceso, mira qué pagó el resto del Estado por algo parecido, con qué
        proveedores y en cuánto tiempo — sobre contratos ya <strong>terminados/cerrados</strong> (no en ejecución, para
        no comparar contra un precio que todavía puede cambiar).
      </p>

      <div style={{ display: 'grid', gap: 8, marginTop: 24 }}>
        <BotonUbicacion
          onSugerir={(d, c) => {
            const depto = DEPARTAMENTOS.find((x) => x.departamento === d);
            if (!depto) return;
            setDepartamento(d);
            setCiudad(depto.ciudades.includes(c) ? c : '');
          }}
        />
        <label>Objeto a contratar <input value={objeto} onChange={(e) => setObjeto(e.target.value)} style={{ width: '100%' }} /></label>
        <label>
          Departamento{' '}
          <select
            value={departamento}
            onChange={(e) => {
              setDepartamento(e.target.value);
              setCiudad('');
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
          Ciudad/Municipio (opcional, todo el departamento si se deja vacío){' '}
          <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            <option value="">Todo el departamento</option>
            {ciudadesDisponibles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label>Desde <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} /></label>
          <label>Hasta <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} /></label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={handleSync} disabled={cargandoSync}>{cargandoSync ? 'Trayendo de SECOP…' : '1. Sincronizar datos de SECOP'}</button>
        <button onClick={handleGenerar} disabled={cargando}>{cargando ? 'Generando…' : '2. Generar estudio'}</button>
      </div>

      {syncInfo && <p style={{ color: 'green' }}>{syncInfo}</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {estudio && estudio.totalContratos === 0 && <p style={{ color: '#888', marginTop: 16 }}>{estudio.mensaje}</p>}

      {estudio && estudio.totalContratos > 0 && (
        <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <h2>{estudio.totalContratos} contratos comparables</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Valor mínimo</div>
              <div style={{ fontWeight: 'bold' }}>${estudio.valorMinimo?.toLocaleString('es-CO')}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Valor promedio</div>
              <div style={{ fontWeight: 'bold' }}>${estudio.valorPromedio?.toLocaleString('es-CO')}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Mediana</div>
              <div style={{ fontWeight: 'bold' }}>${estudio.valorMediana?.toLocaleString('es-CO')}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Valor máximo</div>
              <div style={{ fontWeight: 'bold' }}>${estudio.valorMaximo?.toLocaleString('es-CO')}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Duración promedio</div>
              <div style={{ fontWeight: 'bold' }}>{estudio.duracionPromedioDias ? `${estudio.duracionPromedioDias} días` : 'N/D'}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Proveedores únicos</div>
              <div style={{ fontWeight: 'bold' }}>{estudio.proveedoresUnicos}</div>
            </div>
          </div>

          <h3 style={{ marginTop: 20 }}>Proveedores más frecuentes</h3>
          {estudio.proveedoresFrecuentes?.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '4px 0' }}>
              <span>{p.nombre}</span>
              <span style={{ color: '#888' }}>
                {p.contratos} contrato(s) · ${p.valorTotal.toLocaleString('es-CO')}
              </span>
            </div>
          ))}

          <h3 style={{ marginTop: 20 }}>Contratos comparables</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: 6 }}>Entidad</th>
                  <th style={{ padding: 6 }}>Objeto</th>
                  <th style={{ padding: 6 }}>Proveedor</th>
                  <th style={{ padding: 6 }}>Valor</th>
                  <th style={{ padding: 6 }}>SECOP</th>
                </tr>
              </thead>
              <tbody>
                {estudio.contratosComparables?.map((c) => (
                  <tr key={c.idContrato} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 6 }}>{c.nombreEntidad}</td>
                    <td style={{ padding: 6, maxWidth: 260 }}>{c.objetoDelContrato}</td>
                    <td style={{ padding: 6 }}>{c.proveedorAdjudicado}</td>
                    <td style={{ padding: 6 }}>${c.valorDelContrato.toLocaleString('es-CO')}</td>
                    <td style={{ padding: 6 }}>
                      {c.urlProceso && (
                        <a href={c.urlProceso} target="_blank" rel="noreferrer">
                          Ver →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
