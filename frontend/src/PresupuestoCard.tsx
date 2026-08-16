import { EstadoPresupuestal } from './api';

function periodoLegible(p: string | null): string {
  if (!p || p.length !== 8) return '—';
  return `${p.slice(6, 8)}/${p.slice(4, 6)}/${p.slice(0, 4)}`;
}

/**
 * Presupuesto real de la entidad (CUIPO) al lado de lo contratado en SECOP —
 * cruza dos fuentes de datos abiertos para responder algo que ninguna
 * responde sola: ¿lo que se contrató está respaldado por presupuesto, o
 * sobrepasa lo apropiado?
 */
export default function PresupuestoCard({ p }: { p: EstadoPresupuestal }) {
  if (p.mensaje) {
    return (
      <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 14, marginBottom: 12, background: '#fafafa', color: '#888', fontSize: 13 }}>
        💰 {p.mensaje}
      </div>
    );
  }

  const barra = (valor: number, total: number, color: string) => (
    <div style={{ background: '#eee', borderRadius: 4, height: 6, marginTop: 3 }}>
      <div style={{ background: color, width: `${total > 0 ? Math.min(100, (valor / total) * 100) : 0}%`, height: 6, borderRadius: 4 }} />
    </div>
  );

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 14, marginBottom: 12, background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
        <strong style={{ fontSize: 15 }}>💰 Presupuesto de {p.entidad} (CUIPO)</strong>
        <span style={{ fontSize: 12, color: '#888' }}>Corte: {periodoLegible(p.periodoConsultado)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 10, fontSize: 13 }}>
        <div>
          <div style={{ color: '#888' }}>Presupuesto apropiado</div>
          <div style={{ fontWeight: 'bold' }}>${p.presupuestoApropiado.toLocaleString('es-CO')}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Comprometido</div>
          <div style={{ fontWeight: 'bold' }}>${p.comprometido.toLocaleString('es-CO')}</div>
          {barra(p.comprometido, p.presupuestoApropiado, '#1e40af')}
        </div>
        <div>
          <div style={{ color: '#888' }}>Pagado</div>
          <div style={{ fontWeight: 'bold' }}>${p.pagado.toLocaleString('es-CO')}</div>
          {barra(p.pagado, p.presupuestoApropiado, '#16a34a')}
        </div>
        <div>
          <div style={{ color: '#888' }}>Contratado en SECOP (mismo territorio/rango)</div>
          <div style={{ fontWeight: 'bold' }}>${p.valorContratadoSecop.toLocaleString('es-CO')}</div>
        </div>
      </div>

      {p.alerta && (
        <p style={{ marginTop: 10, fontSize: 13, background: '#fef3c7', border: '1px solid #f0d68a', borderRadius: 6, padding: 8, color: '#92400e' }}>
          ⚠️ {p.alerta}
        </p>
      )}
    </div>
  );
}
import React from 'react';
