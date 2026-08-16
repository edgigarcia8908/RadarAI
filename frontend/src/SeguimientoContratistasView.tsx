import { useEffect, useState } from 'react';
import {
  obtenerResumenSeguimiento,
  obtenerPerfilContratista,
  obtenerRankingContratistas,
  ResumenSeguimiento,
  ContratoSeguimiento,
  PerfilContratista,
  RankingContratista,
} from './api';
import Breadcrumbs from './components/navigation/Breadcrumbs';
import { descargarCSV } from './utils/csv';

function formatoCOP(valor: number | undefined | null): string {
  if (valor == null) return 'N/D';
  return `$${valor.toLocaleString('es-CO')}`;
}

function semaforoContrato(c: ContratoSeguimiento): { color: string; texto: string } {
  if (c.sobrecosto) return { color: '#991b1b', texto: 'Sobrecosto' };
  if (c.prorrogas > 0) return { color: '#92400e', texto: 'Con prórroga' };
  return { color: '#166534', texto: 'Normal' };
}

export default function SeguimientoContratistasView({ onHome }: { onHome?: () => void }) {
  const [resumen, setResumen] = useState<ResumenSeguimiento | null>(null);
  const [ranking, setRanking] = useState<RankingContratista[]>([]);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nit, setNit] = useState('');
  const [perfil, setPerfil] = useState<PerfilContratista | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setCargandoResumen(true);
      setError(null);
      try {
        const [r, rank] = await Promise.all([obtenerResumenSeguimiento(), obtenerRankingContratistas(20)]);
        setResumen(r);
        setRanking(rank);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setCargandoResumen(false);
      }
    })();
  }, []);

  async function handleBuscarPerfil(aBuscar?: string) {
    const nitABuscar = (aBuscar ?? nit).trim();
    if (!nitABuscar) return;
    setCargandoPerfil(true);
    setErrorPerfil(null);
    setPerfil(null);
    try {
      const p = await obtenerPerfilContratista(nitABuscar);
      setPerfil(p);
    } catch (e: any) {
      setErrorPerfil(e.message);
    } finally {
      setCargandoPerfil(false);
    }
  }

  function descargarRanking() {
    descargarCSV(
      'ranking-contratistas',
      ['Posición', 'NIT', 'Nombre', 'Contratos', 'Valor total (COP)', 'Entidades', 'Municipios'],
      ranking.map((r, i) => [i + 1, r.nit, r.nombre, r.contratos, r.valorTotal, r.entidades, r.municipios]),
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Inicio', onClick: onHome! }, { label: 'Seguimiento de contratistas' }]} />
      <h1 className="view-title">🔍 Seguimiento de contratistas</h1>
      <p className="view-subtitle">
        Para veedores y ciudadanía: mira la recurrencia de un proveedor, cuánto ha recibido del Estado y si sus
        contratos acumulan sobrecostos o prórrogas.
      </p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {cargandoResumen && <p style={{ color: '#888' }}>Cargando resumen…</p>}

      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 }}>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Contratos</div>
            <div style={{ fontWeight: 'bold' }}>{resumen.totalContratos}</div>
          </div>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Valor total</div>
            <div style={{ fontWeight: 'bold' }}>{formatoCOP(resumen.valorTotal)}</div>
          </div>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Proveedores únicos</div>
            <div style={{ fontWeight: 'bold' }}>{resumen.proveedoresUnicos}</div>
          </div>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>En ejecución</div>
            <div style={{ fontWeight: 'bold' }}>{resumen.enEjecucion}</div>
          </div>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Liquidados</div>
            <div style={{ fontWeight: 'bold' }}>{resumen.liquidados}</div>
          </div>
          <div style={{ background: '#fff3cd', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#8a6d3b' }}>Con prórroga</div>
            <div style={{ fontWeight: 'bold' }}>{resumen.conProrroga}</div>
          </div>
          {resumen.conSobrecosto > 0 && (
            <div style={{ background: '#f8d7da', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#842029' }}>Con sobrecosto</div>
              <div style={{ fontWeight: 'bold' }}>{resumen.conSobrecosto}</div>
            </div>
          )}
          {resumen.sobrecostoTotal > 0 && (
            <div style={{ background: '#f8d7da', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#842029' }}>Sobrecosto total</div>
              <div style={{ fontWeight: 'bold' }}>{formatoCOP(resumen.sobrecostoTotal)}</div>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Contratistas más recurrentes</h2>
      {ranking.length > 0 && (
        <button
          type="button"
          onClick={descargarRanking}
          style={{ fontSize: 12, padding: '3px 10px', marginTop: 8 }}
        >
          Descargar ranking (CSV)
        </button>
      )}
      {ranking.length === 0 && !cargandoResumen && <p style={{ color: '#888' }}>Sin datos de recurrencia.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {ranking.map((r, i) => (
          <button
            key={r.nit}
            type="button"
            onClick={() => {
              setNit(r.nit);
              handleBuscarPerfil(r.nit);
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              borderBottom: '1px solid #eee',
              padding: '8px 4px',
              textAlign: 'left',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <span>
              <strong>{i + 1}. {r.nombre}</strong>
              <span style={{ color: '#888', fontSize: 12 }}> · NIT {r.nit}</span>
            </span>
            <span style={{ color: '#555', fontSize: 13, textAlign: 'right' }}>
              {r.contratos} contrato(s) · {formatoCOP(r.valorTotal)}
              <br />
              <span style={{ color: '#888', fontSize: 12 }}>{r.entidades} entidades · {r.municipios} municipios</span>
            </span>
          </button>
        ))}
      </div>

      <h2 style={{ marginTop: 28 }}>Perfil de un contratista</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <input
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          placeholder="NIT del contratista, ej. 900123456"
          style={{ flex: 1 }}
        />
        <button onClick={() => handleBuscarPerfil()} disabled={cargandoPerfil || nit.trim() === ''}>
          {cargandoPerfil ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {errorPerfil && <p style={{ color: 'crimson', marginTop: 8 }}>{errorPerfil}</p>}

      {perfil && (
        <div style={{ marginTop: 20, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          <h3>{perfil.nombre} <span style={{ color: '#888', fontWeight: 'normal', fontSize: 14 }}>NIT {perfil.nit}</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 8 }}>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Contratos</div>
              <div style={{ fontWeight: 'bold' }}>{perfil.resumen.totalContratos}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Valor total</div>
              <div style={{ fontWeight: 'bold' }}>{formatoCOP(perfil.resumen.valorTotal)}</div>
            </div>
            <div style={{ background: perfil.resumen.sobrecostoTotal > 0 ? '#f8d7da' : '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Sobrecosto total</div>
              <div style={{ fontWeight: 'bold' }}>{formatoCOP(perfil.resumen.sobrecostoTotal)}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Entidades</div>
              <div style={{ fontWeight: 'bold' }}>{perfil.resumen.entidades}</div>
            </div>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Municipios</div>
              <div style={{ fontWeight: 'bold' }}>{perfil.resumen.municipios}</div>
            </div>
          </div>

          <h4 style={{ marginTop: 20 }}>Contratos</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: 6 }}>Estado</th>
                  <th style={{ padding: 6 }}>Objeto</th>
                  <th style={{ padding: 6 }}>Entidad</th>
                  <th style={{ padding: 6 }}>Inicio</th>
                  <th style={{ padding: 6 }}>Fin</th>
                  <th style={{ padding: 6 }}>Valor</th>
                  <th style={{ padding: 6 }}>Pagado</th>
                  <th style={{ padding: 6 }}>Veedor</th>
                  <th style={{ padding: 6 }}>Responsable</th>
                  <th style={{ padding: 6 }}>SECOP</th>
                </tr>
              </thead>
              <tbody>
                {perfil.contratos.map((c) => {
                  const s = semaforoContrato(c);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: 6 }}>
                        <span
                          style={{
                            background: s.color,
                            color: '#fff',
                            borderRadius: 10,
                            padding: '2px 8px',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.texto}
                        </span>
                      </td>
                      <td style={{ padding: 6, maxWidth: 240 }}>{c.objeto}</td>
                      <td style={{ padding: 6 }}>{c.entidad}</td>
                      <td style={{ padding: 6 }}>{c.fechaInicio ? c.fechaInicio.slice(0, 10) : 'N/D'}</td>
                      <td style={{ padding: 6 }}>{c.fechaFin ? c.fechaFin.slice(0, 10) : 'N/D'}</td>
                      <td style={{ padding: 6 }}>{formatoCOP(c.valorDelContrato)}</td>
                      <td style={{ padding: 6 }}>{formatoCOP(c.valorPagado)}</td>
                      <td style={{ padding: 6 }}>{c.veedor || '—'}</td>
                      <td style={{ padding: 6 }}>{c.responsable || '—'}</td>
                      <td style={{ padding: 6 }}>
                        {c.urlProceso && (
                          <a href={c.urlProceso} target="_blank" rel="noreferrer">Ver →</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}