import { useState } from 'react';
import { obtenerPerfilFuncionario, PerfilFuncionario as PerfilFuncionarioT } from './api';

function fecha(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * "¿Este funcionario siempre contrata a los mismos proveedores dondequiera
 * que trabaje?" — pedido explícito: un supervisor/ordenador del gasto
 * puede pasar por varios municipios a lo largo de su carrera; si el mismo
 * proveedor lo sigue de municipio en municipio, es una señal mucho más
 * fuerte que la concentración de proveedores dentro de un solo territorio.
 * Se carga bajo demanda (no automático) porque implica una consulta cruzada
 * de TODO lo sincronizado, no solo el territorio actual. El detalle
 * completo (tabla de contratos) se pide explícitamente aparte — la mayoría
 * de las veces el resumen alcanza, no hace falta cargar 30 filas siempre.
 */
export default function PerfilFuncionario({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [perfil, setPerfil] = useState<PerfilFuncionarioT | null>(null);
  const [verDetalle, setVerDetalle] = useState(false);

  async function toggle() {
    if (abierto) {
      setAbierto(false);
      return;
    }
    setAbierto(true);
    if (perfil) return;
    setCargando(true);
    try {
      setPerfil(await obtenerPerfilFuncionario(nombre));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ marginTop: 4 }}>
      <button onClick={toggle} style={{ fontSize: 12, padding: '2px 8px', background: 'transparent', color: '#1a2b6d', border: '1px solid #1a2b6d' }}>
        {abierto ? '▲' : '🔍'} Ver historial de {nombre} en otros municipios
      </button>

      {abierto && cargando && <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Buscando en lo sincronizado…</p>}

      {abierto && perfil && (
        <div style={{ marginTop: 6, fontSize: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 10 }}>
          {perfil.totalContratos === 0 ? (
            <p style={{ color: '#888', margin: 0 }}>No encontramos otros contratos de esta persona en lo ya sincronizado.</p>
          ) : (
            <>
              <p style={{ margin: '0 0 6px' }}>
                <strong>{perfil.totalContratos}</strong> contrato(s) por <strong>${(perfil.valorTotal ?? 0).toLocaleString('es-CO')}</strong> como
                supervisor/ordenador del gasto en <strong>{perfil.municipios.length}</strong> municipio(s):{' '}
                {perfil.municipios.map((m) => `${m.ciudad} (${m.contratos})`).join(', ')}
              </p>

              {perfil.proveedoresFrecuentes.length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: 6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '3px 6px' }}>Proveedor</th>
                        <th style={{ padding: '3px 6px' }}>Contratos</th>
                        <th style={{ padding: '3px 6px' }}>Valor total</th>
                        <th style={{ padding: '3px 6px' }}>Municipios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfil.proveedoresFrecuentes.map((p) => (
                        <tr key={p.nombre} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '3px 6px' }}>{p.nombre}</td>
                          <td style={{ padding: '3px 6px' }}>{p.contratos}</td>
                          <td style={{ padding: '3px 6px' }}>${p.valorTotal.toLocaleString('es-CO')}</td>
                          <td style={{ padding: '3px 6px', color: p.municipios.length > 1 ? '#991b1b' : undefined, fontWeight: p.municipios.length > 1 ? 'bold' : undefined }}>
                            {p.municipios.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {perfil.alerta && (
                <p style={{ margin: '0 0 6px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', color: '#991b1b' }}>
                  ⚠️ {perfil.alerta}
                </p>
              )}

              <button
                onClick={() => setVerDetalle((v) => !v)}
                style={{ fontSize: 12, padding: '2px 8px', background: 'transparent', color: '#1a2b6d', border: '1px solid #1a2b6d' }}
              >
                {verDetalle ? '▲ Ocultar' : '▼ Profundizar:'} lista completa de contratos
              </button>

              {verDetalle && (
                <div style={{ overflowX: 'auto', marginTop: 6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                        <th style={{ padding: '3px 6px' }}>Entidad</th>
                        <th style={{ padding: '3px 6px' }}>Municipio</th>
                        <th style={{ padding: '3px 6px' }}>Objeto</th>
                        <th style={{ padding: '3px 6px' }}>Proveedor</th>
                        <th style={{ padding: '3px 6px' }}>Valor</th>
                        <th style={{ padding: '3px 6px' }}>Firmado</th>
                        <th style={{ padding: '3px 6px' }}>SECOP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfil.contratos.map((c) => (
                        <tr key={c.idContrato} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '3px 6px' }}>{c.nombreEntidad}</td>
                          <td style={{ padding: '3px 6px' }}>{c.ciudad}</td>
                          <td style={{ padding: '3px 6px', maxWidth: 260 }}>{c.objetoDelContrato}</td>
                          <td style={{ padding: '3px 6px' }}>{c.proveedorAdjudicado}</td>
                          <td style={{ padding: '3px 6px' }}>${c.valorDelContrato.toLocaleString('es-CO')}</td>
                          <td style={{ padding: '3px 6px' }}>{fecha(c.fechaDeFirma)}</td>
                          <td style={{ padding: '3px 6px' }}>
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
                  {perfil.totalContratos > perfil.contratos.length && (
                    <p style={{ color: '#888', margin: '4px 0 0' }}>
                      Mostrando {perfil.contratos.length} de {perfil.totalContratos} — hay más contratos de los que se muestran acá.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
import React from 'react';
