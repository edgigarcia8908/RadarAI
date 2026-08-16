import { useEffect, useState } from 'react';
import {
  cargarAlertasCsv,
  listarAlertas,
  marcarAlertaRevisada,
  Alerta,
  ResultadoCarga,
  SeveridadAlerta,
  EstadoAlerta,
} from '../../api';
import Breadcrumbs from '../navigation/Breadcrumbs';
import { descargarCSV } from '../../utils/csv';

const COLOR_SEVERIDAD: Record<SeveridadAlerta, { fondo: string; texto: string; etiqueta: string }> = {
  ALTA: { fondo: '#991b1b', texto: '#fff', etiqueta: 'Alta' },
  MEDIA: { fondo: '#92400e', texto: '#fff', etiqueta: 'Media' },
  INFO: { fondo: '#6c757d', texto: '#fff', etiqueta: 'Info' },
};

export default function DenunciasView({ onHome }: { onHome?: () => void }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fuente, setFuente] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoCarga | null>(null);

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [cargandoAlertas, setCargandoAlertas] = useState(true);
  const [errorAlertas, setErrorAlertas] = useState<string | null>(null);

  async function cargarAlertas(estado?: EstadoAlerta) {
    setCargandoAlertas(true);
    setErrorAlertas(null);
    try {
      const r = await listarAlertas(estado);
      setAlertas(r);
    } catch (e: any) {
      setErrorAlertas(e.message);
    } finally {
      setCargandoAlertas(false);
    }
  }

  useEffect(() => {
    cargarAlertas(soloAbiertas ? 'ABIERTA' : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloAbiertas]);

  async function handleCargar() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const r = await cargarAlertasCsv(archivo, fuente.trim() || undefined);
      setResultado(r);
      await cargarAlertas(soloAbiertas ? 'ABIERTA' : undefined);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleRevisar(id: string) {
    try {
      await marcarAlertaRevisada(id);
      await cargarAlertas(soloAbiertas ? 'ABIERTA' : undefined);
    } catch (e: any) {
      setErrorAlertas(e.message);
    }
  }

  function descargarAlertas() {
    descargarCSV(
      'alertas-radarai',
      ['Proveedor', 'NIT', 'Contratos', 'Valor total (COP)', 'Sobrecosto total (COP)', 'Severidad', 'Estado', 'Motivo', 'Creada', 'Fuente'],
      alertas.map((a) => [
        a.proveedor,
        a.nitProveedor ?? '',
        a.contratos,
        a.valorTotal ?? 0,
        a.sobrecostoTotal,
        COLOR_SEVERIDAD[a.severidad].etiqueta,
        a.estado === 'ABIERTA' ? 'Abierta' : 'Revisada',
        a.motivo ?? '',
        a.createdAt ? new Date(a.createdAt).toLocaleDateString('es-CO') : '',
        a.fuenteArchivo ?? '',
      ]),
    );
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Inicio', onClick: onHome! }, { label: 'Denuncias y alertas' }]} />
      <h1 className="view-title">🚨 Denuncias y alertas</h1>
      <p className="view-subtitle">
        Sube en masa una lista de proveedores (CSV) y RadarAI la cruza contra SECOP: si un proveedor concentra
        contratos, arrastra sobrecostos o recibe sumas exageradas, queda señalado como alerta.
      </p>

      <div style={{ display: 'grid', gap: 8, marginTop: 16, maxWidth: 560 }}>
        <label>
          Fuente del archivo (opcional, ej: 'Denuncia vecinal 2026-08'){' '}
          <input value={fuente} onChange={(e) => setFuente(e.target.value)} style={{ width: '100%' }} />
        </label>
        <label>
          Archivo CSV (columna con proveedores){' '}
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            disabled={cargando}
          />
        </label>
        <button onClick={handleCargar} disabled={cargando || !archivo} style={{ justifySelf: 'start' }}>
          {cargando ? 'Analizando…' : 'Analizar contra SECOP'}
        </button>
      </div>

      {error && <p style={{ color: 'crimson', marginTop: 8 }}>{error}</p>}

      {resultado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 16 }}>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Proveedores analizados</div>
            <div style={{ fontWeight: 'bold' }}>{resultado.procesados}</div>
          </div>
          <div style={{ background: '#f4f4f4', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#888' }}>Sin coincidencia en SECOP</div>
            <div style={{ fontWeight: 'bold' }}>{resultado.sinCoincidencia}</div>
          </div>
          <div style={{ background: '#f8d7da', borderRadius: 8, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#842029' }}>Alertas generadas</div>
            <div style={{ fontWeight: 'bold' }}>{resultado.alertas.length}</div>
          </div>
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Alertas</h2>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button onClick={() => setSoloAbiertas(true)} disabled={soloAbiertas}>Solo abiertas</button>
        <button onClick={() => setSoloAbiertas(false)} disabled={!soloAbiertas}>Todas</button>
        <button onClick={descargarAlertas} disabled={alertas.length === 0} style={{ fontSize: 12, padding: '3px 10px' }}>
          Descargar alertas (CSV)
        </button>
      </div>

      {errorAlertas && <p style={{ color: 'crimson', marginTop: 8 }}>{errorAlertas}</p>}
      {cargandoAlertas && <p style={{ color: '#888' }}>Cargando alertas…</p>}

      {!cargandoAlertas && alertas.length === 0 && <p style={{ color: '#888', marginTop: 8 }}>No hay alertas.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {alertas.map((a) => {
          const s = COLOR_SEVERIDAD[a.severidad];
          return (
            <div
              key={a._id}
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>
                  <strong>{a.proveedor}</strong>{' '}
                  <span style={{ color: '#888', fontSize: 12 }}>NIT {a.nitProveedor || '—'}</span>
                </span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ background: s.fondo, color: s.texto, borderRadius: 10, padding: '2px 8px', fontSize: 11 }}>
                    {s.etiqueta}
                  </span>
                  <span style={{ background: a.estado === 'ABIERTA' ? '#fff3cd' : '#e2e3e5', borderRadius: 10, padding: '2px 8px', fontSize: 11 }}>
                    {a.estado === 'ABIERTA' ? 'Abierta' : 'Revisada'}
                  </span>
                  {a.estado === 'ABIERTA' && (
                    <button onClick={() => handleRevisar(a._id)} style={{ fontSize: 12, padding: '3px 10px' }}>
                      Marcar revisada
                    </button>
                  )}
                </span>
              </div>
              {a.motivo && <div style={{ fontSize: 13, color: '#444' }}>{a.motivo}</div>}
              <div style={{ fontSize: 12, color: '#888', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>{a.contratos} contrato(s)</span>
                <span>${(a.valorTotal ?? 0).toLocaleString('es-CO')}</span>
                {a.sobrecostoTotal > 0 && (
                  <span style={{ color: '#991b1b' }}>Sobrecosto ${a.sobrecostoTotal.toLocaleString('es-CO')}</span>
                )}
                {a.createdAt && <span>Creada {new Date(a.createdAt).toLocaleDateString('es-CO')}</span>}
                {a.fuenteArchivo && <span>Fuente: {a.fuenteArchivo}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}