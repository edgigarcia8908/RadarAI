import { useMemo, useState } from 'react';
import { obtenerFichaTerritorial, FichaTerritorial } from './api';
import colombia from './colombia.json';
import PresupuestoCard from './PresupuestoCard';
import ContextoTerritorialCard from './ContextoTerritorialCard';

interface DeptoColombia {
  departamento: string;
  ciudades: string[];
}
const DEPARTAMENTOS = colombia as DeptoColombia[];

/**
 * Fase 0 de la hoja de ruta: consolida en una sola pantalla lo que hoy vive
 * repartido entre Vigilar mi territorio, Estudio de mercado y Mapa de
 * riesgo. No agrega ninguna fuente nueva — solo junta identidad (DIVIPOLA),
 * contratación, presupuesto (CUIPO), regalías (SGR), desempeño (MDM) y un
 * resumen de las alertas de identidad (SIRI/SIGEP) de un municipio.
 */
export default function FichaTerritorialView() {
  const [departamento, setDepartamento] = useState('Cundinamarca');
  const [ciudad, setCiudad] = useState('Tocancipá');
  const ciudadesDisponibles = useMemo(
    () => DEPARTAMENTOS.find((d) => d.departamento === departamento)?.ciudades ?? [],
    [departamento],
  );
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<FichaTerritorial | null>(null);

  async function handleConsultar() {
    setCargando(true);
    setError(null);
    setFicha(null);
    try {
      setFicha(await obtenerFichaTerritorial(departamento, ciudad));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <h1>📍 Ficha territorial</h1>
      <p style={{ color: '#555' }}>
        Todo lo que RadarAI sabe de un municipio, junto: identidad, contratación, presupuesto, regalías, desempeño y
        alertas de identidad. Consolidado de las fuentes que ya tenemos — nada nuevo, solo en un solo lugar.
      </p>

      <div style={{ display: 'grid', gap: 8, marginTop: 24 }}>
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
      </div>

      <button onClick={handleConsultar} disabled={cargando} style={{ marginTop: 16 }}>
        {cargando ? 'Consultando…' : 'Ver ficha'}
      </button>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {ficha && (
        <div style={{ marginTop: 24, borderTop: '1px solid #ddd', paddingTop: 16 }}>
          {ficha.identidad ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <h2 style={{ margin: 0 }}>
                {ficha.identidad.nombreMunicipio}, {ficha.identidad.nombreDepartamento}
              </h2>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#888' }}>DIVIPOLA {ficha.identidad.codigoDivipola}</span>
            </div>
          ) : (
            <p style={{ color: '#888' }}>No se pudo resolver la identidad DIVIPOLA de este municipio (dataset sin cobertura o nombre no coincide).</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
            <Metrica etiqueta="Contratos sincronizados" valor={ficha.contratacion.totalContratos.toLocaleString('es-CO')} />
            <Metrica etiqueta="Valor total contratado" valor={`$${ficha.contratacion.valorTotal.toLocaleString('es-CO')}`} />
            <Metrica etiqueta="Proveedores únicos" valor={ficha.contratacion.proveedoresUnicos.toLocaleString('es-CO')} />
            <Metrica
              etiqueta="Concentración de proveedores"
              valor={`${ficha.contratacion.concentracionProveedores}%`}
              alerta={ficha.contratacion.concentracionProveedores >= 70}
            />
          </div>

          <h3 style={{ marginTop: 28 }}>Presupuesto vs. contratación</h3>
          <PresupuestoCard p={ficha.presupuesto} />

          <h3 style={{ marginTop: 8 }}>Contexto territorial</h3>
          <ContextoTerritorialCard
            ctx={{
              ciudad: ficha.identidad?.nombreMunicipio ?? ciudad,
              desempenoMunicipal: ficha.desempenoMunicipal,
              proyectosRegalias: ficha.proyectosRegalias,
              alerta: ficha.alertaRegalias,
            }}
          />

          <h3 style={{ marginTop: 8 }}>Alertas de identidad (SIRI + SIGEP)</h3>
          <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 14, fontSize: 13 }}>
            <p style={{ margin: 0 }}>
              Se revisaron <strong>{ficha.alertasIdentidad.nombresRevisados}</strong> nombres distintos (firmantes, ordenadores del gasto,
              supervisores) contra SIRI (sanciones) y SIGEP (cargos de confianza)
              {ficha.alertasIdentidad.totalNombresDistintos > ficha.alertasIdentidad.nombresRevisados
                ? ` — de ${ficha.alertasIdentidad.totalNombresDistintos} nombres distintos en total en lo sincronizado (se revisa una muestra para no saturar la consulta).`
                : '.'}
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ color: ficha.alertasIdentidad.coincidenciasSiri > 0 ? '#991b1b' : '#166534' }}>
                {ficha.alertasIdentidad.coincidenciasSiri > 0
                  ? `⚠️ ${ficha.alertasIdentidad.coincidenciasSiri} coincidencia(s) con SIRI`
                  : '✓ Sin coincidencias con SIRI'}
              </span>
              <span style={{ color: ficha.alertasIdentidad.coincidenciasSigep > 0 ? '#1e40af' : '#166534' }}>
                {ficha.alertasIdentidad.coincidenciasSigep > 0
                  ? `ℹ️ ${ficha.alertasIdentidad.coincidenciasSigep} coincidencia(s) con SIGEP`
                  : '✓ Sin coincidencias con SIGEP'}
              </span>
            </div>
            <p style={{ margin: '8px 0 0', color: '#888', fontSize: 12 }}>
              Recordá: son coincidencias de NOMBRE, no de identidad verificada — el detalle con disclaimer completo está en cada
              contrato, en Vigilar mi territorio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Metrica({ etiqueta, valor, alerta }: { etiqueta: string; valor: string; alerta?: boolean }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#888' }}>{etiqueta}</div>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: alerta ? '#991b1b' : undefined }}>{valor}</div>
    </div>
  );
}
