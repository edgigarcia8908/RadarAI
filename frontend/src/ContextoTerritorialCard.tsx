import { useState } from 'react';
import { ContextoTerritorial } from './api';

function colorMdm(puntaje: number): string {
  if (puntaje >= 70) return '#166534';
  if (puntaje >= 50) return '#92400e';
  return '#991b1b';
}

/**
 * Contexto socioeconómico/territorial que ni SECOP ni CUIPO dan solos:
 * ¿qué tan bien gestiona este municipio en general (MDM, sucesor vigente
 * de TerriData)? y ¿los proyectos financiados con REGALÍAS avanzan en obra
 * al mismo ritmo que se les paga (ejecución física vs. financiera)?
 */
export default function ContextoTerritorialCard({ ctx }: { ctx: ContextoTerritorial }) {
  const [verTodos, setVerTodos] = useState(false);
  const { desempenoMunicipal, proyectosRegalias } = ctx;
  const sinDatos = desempenoMunicipal.puntaje === null && proyectosRegalias.length === 0;

  if (sinDatos) return null;

  const proyectosOrdenados = [...proyectosRegalias].sort((a, b) => (b.brechaEjecucion ?? -999) - (a.brechaEjecucion ?? -999));
  const visibles = verTodos ? proyectosOrdenados : proyectosOrdenados.slice(0, 5);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 14, marginBottom: 12, background: '#fff' }}>
      <strong style={{ fontSize: 15 }}>🗺️ Contexto de {ctx.ciudad}</strong>

      {desempenoMunicipal.puntaje !== null && (
        <p style={{ margin: '8px 0', fontSize: 13 }}>
          Índice de Medición del Desempeño Municipal (DNP, {desempenoMunicipal.anio}):{' '}
          <strong style={{ color: colorMdm(desempenoMunicipal.puntaje) }}>{desempenoMunicipal.puntaje.toFixed(1)}/100</strong>
        </p>
      )}

      {proyectosRegalias.length > 0 && (
        <>
          <p style={{ margin: '8px 0 4px', fontSize: 13 }}>
            <strong>{proyectosRegalias.length}</strong> proyecto(s) financiado(s) con regalías (Sistema General de Regalías, DNP):
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '3px 6px' }}>Proyecto</th>
                  <th style={{ padding: '3px 6px' }}>Sector</th>
                  <th style={{ padding: '3px 6px' }}>Valor</th>
                  <th style={{ padding: '3px 6px' }}>Estado</th>
                  <th style={{ padding: '3px 6px' }}>Ejec. financiera</th>
                  <th style={{ padding: '3px 6px' }}>Ejec. física</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '3px 6px', maxWidth: 260 }}>{p.nombre}</td>
                    <td style={{ padding: '3px 6px' }}>{p.sector}</td>
                    <td style={{ padding: '3px 6px' }}>${p.valorTotal.toLocaleString('es-CO')}</td>
                    <td style={{ padding: '3px 6px' }}>{p.estado}</td>
                    <td style={{ padding: '3px 6px' }}>{p.ejecucionFinanciera ?? '—'}%</td>
                    <td
                      style={{
                        padding: '3px 6px',
                        color: p.brechaEjecucion !== null && p.brechaEjecucion > 30 ? '#991b1b' : undefined,
                        fontWeight: p.brechaEjecucion !== null && p.brechaEjecucion > 30 ? 'bold' : undefined,
                      }}
                    >
                      {p.ejecucionFisica ?? '—'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {proyectosOrdenados.length > 5 && (
            <button onClick={() => setVerTodos((v) => !v)} style={{ fontSize: 12, marginTop: 6, padding: '2px 8px', background: 'transparent', color: 'var(--radar-olive)', border: '1px solid var(--radar-olive)' }}>
              {verTodos ? '▲ Ver menos' : `▼ Ver los ${proyectosOrdenados.length} proyectos`}
            </button>
          )}
        </>
      )}

      {ctx.alerta && (
        <p style={{ marginTop: 10, fontSize: 13, background: '#fef3c7', border: '1px solid #f0d68a', borderRadius: 6, padding: 8, color: '#92400e' }}>
          ⚠️ {ctx.alerta}
        </p>
      )}
    </div>
  );
}
import React from 'react';
