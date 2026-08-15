import { ContratoInfo, analizarTiempo, duracionLegible } from './contratoUtils';

function fecha(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Tarjeta visual de un contrato — pensada para "gente normal", no para
 * alguien que sabe leer un JSON de SECOP. Muestra de un vistazo: quién
 * contrató a quién, quién firmó, cuándo empezó/terminó (o si va tarde),
 * cuánto se ha pagado, y si hubo prórrogas.
 */
export default function ContratoCard({ c }: { c: ContratoInfo }) {
  const analisis = analizarTiempo(c);
  const porcentajePagado = c.valorDelContrato > 0 && c.valorPagado != null ? Math.min(100, (c.valorPagado / c.valorDelContrato) * 100) : null;

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 14, marginBottom: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15 }}>{c.nombreEntidad}</strong>
        <span style={{ background: analisis.colorFondo, color: analisis.colorTexto, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 'bold' }}>
          {analisis.etiqueta}
        </span>
      </div>

      <p style={{ margin: '8px 0', fontSize: 14 }}>{c.objetoDelContrato || c.descripcionDelProceso}</p>

      {analisis.porcentajeTiempo !== null && (
        <div style={{ margin: '8px 0' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>Tiempo transcurrido{analisis.duracionLegible ? ` — ${analisis.duracionLegible}` : ''}</div>
          <div style={{ background: '#eee', borderRadius: 4, height: 6 }}>
            <div style={{ background: analisis.colorTexto, width: `${analisis.porcentajeTiempo}%`, height: 6, borderRadius: 4 }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6, fontSize: 13, marginTop: 10 }}>
        <div><span style={{ color: '#888' }}>Proveedor:</span> {c.proveedorAdjudicado}</div>
        {c.nombreRepresentanteLegal && (
          <div><span style={{ color: '#888' }}>Quién firmó:</span> {c.nombreRepresentanteLegal}</div>
        )}
        {c.nombreOrdenadorDelGasto && (
          <div><span style={{ color: '#888' }}>Autorizó el gasto:</span> {c.nombreOrdenadorDelGasto}</div>
        )}
        <div><span style={{ color: '#888' }}>Firmado:</span> {fecha(c.fechaDeFirma)}</div>
        <div><span style={{ color: '#888' }}>Inicio:</span> {fecha(c.fechaDeInicio)}</div>
        <div><span style={{ color: '#888' }}>Fin previsto:</span> {fecha(c.fechaDeFin)}</div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          <span>${c.valorDelContrato.toLocaleString('es-CO')}</span>
          {porcentajePagado !== null && <span style={{ color: '#888' }}>{Math.round(porcentajePagado)}% pagado</span>}
        </div>
        {porcentajePagado !== null && (
          <div style={{ background: '#eee', borderRadius: 4, height: 6, marginTop: 3 }}>
            <div style={{ background: '#16a34a', width: `${porcentajePagado}%`, height: 6, borderRadius: 4 }} />
          </div>
        )}
      </div>

      {!!c.diasAdicionados && c.diasAdicionados > 0 && (
        <p style={{ marginTop: 8, fontSize: 13, color: '#92400e' }}>
          ⏱️ Se le agregaron {duracionLegible(c.diasAdicionados)} de prórroga sobre lo pactado originalmente.
        </p>
      )}

      {c.origenDeLosRecursos && (
        <p style={{ marginTop: 4, fontSize: 12, color: '#888' }}>
          Fuente de los recursos: {c.origenDeLosRecursos}
          {c.destinoGasto ? ` · ${c.destinoGasto}` : ''}
        </p>
      )}

      {c.urlProceso && (
        <a href={c.urlProceso} target="_blank" rel="noreferrer" style={{ fontSize: 13, display: 'inline-block', marginTop: 6 }}>
          Ver proceso original en SECOP →
        </a>
      )}
    </div>
  );
}
