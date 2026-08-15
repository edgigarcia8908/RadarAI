import { useState } from 'react';
import { obtenerPerfilFuncionario, PerfilFuncionario as PerfilFuncionarioT } from './api';

/**
 * "¿Este funcionario siempre contrata a los mismos proveedores dondequiera
 * que trabaje?" — pedido explícito: un supervisor/ordenador del gasto
 * puede pasar por varios municipios a lo largo de su carrera; si el mismo
 * proveedor lo sigue de municipio en municipio, es una señal mucho más
 * fuerte que la concentración de proveedores dentro de un solo territorio.
 * Se carga bajo demanda (no automático) porque implica una consulta cruzada
 * de TODO lo sincronizado, no solo el territorio actual.
 */
export default function PerfilFuncionario({ nombre }: { nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [perfil, setPerfil] = useState<PerfilFuncionarioT | null>(null);

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
                <strong>{perfil.totalContratos}</strong> contrato(s) como supervisor/ordenador del gasto en{' '}
                <strong>{perfil.municipios.length}</strong> municipio(s): {perfil.municipios.map((m) => `${m.ciudad} (${m.contratos})`).join(', ')}
              </p>
              {perfil.proveedoresFrecuentes.length > 0 && (
                <p style={{ margin: '0 0 6px' }}>
                  Proveedores más frecuentes bajo su supervisión:{' '}
                  {perfil.proveedoresFrecuentes
                    .slice(0, 5)
                    .map((p) => `${p.nombre} (${p.contratos}${p.municipios.length > 1 ? `, en ${p.municipios.length} municipios` : ''})`)
                    .join('; ')}
                </p>
              )}
              {perfil.alerta && (
                <p style={{ margin: 0, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', color: '#991b1b' }}>
                  ⚠️ {perfil.alerta}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
