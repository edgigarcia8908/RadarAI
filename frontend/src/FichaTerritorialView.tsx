import { useMemo, useState } from 'react';
import { obtenerFichaTerritorial, FichaTerritorial } from './api';
import colombia from './colombia.json';
import PresupuestoCard from './PresupuestoCard';
import ContextoTerritorialCard from './ContextoTerritorialCard';
import { formatearPesos } from './constants/CURRENCY';

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
    <div className="territory-view">
      <div className="territory-header">
        <div>
          <span className="view-eyebrow">Perfil municipal</span>
          <h1>Ficha territorial</h1>
          <p>Consulta en un solo lugar la identidad, contratación, presupuesto y alertas de un municipio.</p>
        </div>
        <span className="territory-source-badge">Datos oficiales</span>
      </div>

      <div className="territory-query-panel">
        <label className="territory-field">
          <span>Departamento</span>
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
        <label className="territory-field">
          <span>Ciudad/Municipio</span>
          <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
            {ciudadesDisponibles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="territory-query-button" onClick={handleConsultar} disabled={cargando} type="button">
        {cargando ? 'Consultando...' : 'Ver ficha'}
      </button>

      {error && <p className="view-error">{error}</p>}

      {ficha && (
        <div className="territory-result">
          {ficha.identidad ? (
            <div className="territory-identity">
              <div>
              <span className="view-eyebrow">Territorio seleccionado</span>
              <h2>
                {ficha.identidad.nombreMunicipio}, {ficha.identidad.nombreDepartamento}
              </h2>
              </div>
              <span className="territory-code">DIVIPOLA {ficha.identidad.codigoDivipola}</span>
            </div>
          ) : (
            <p className="territory-muted">No se pudo resolver la identidad DIVIPOLA de este municipio.</p>
          )}

          <div className="territory-metrics">
            <Metrica etiqueta="Contratos sincronizados" valor={ficha.contratacion.totalContratos.toLocaleString('es-CO')} />
            <Metrica etiqueta="Valor total contratado" valor={formatearPesos(ficha.contratacion.valorTotal)} />
            <Metrica etiqueta="Proveedores únicos" valor={ficha.contratacion.proveedoresUnicos.toLocaleString('es-CO')} />
            <Metrica
              etiqueta="Concentración de proveedores"
              valor={`${ficha.contratacion.concentracionProveedores}%`}
              alerta={ficha.contratacion.concentracionProveedores >= 70}
            />
          </div>

          <section className="territory-section">
          <h3>Presupuesto vs. contratación</h3>
          <div className="territory-legacy-card"><PresupuestoCard p={ficha.presupuesto} /></div>
          </section>

          <section className="territory-section">
          <h3>Contexto territorial</h3>
          <div className="territory-legacy-card"><ContextoTerritorialCard
            ctx={{
              ciudad: ficha.identidad?.nombreMunicipio ?? ciudad,
              desempenoMunicipal: ficha.desempenoMunicipal,
              proyectosRegalias: ficha.proyectosRegalias,
              alerta: ficha.alertaRegalias,
            }}
          /></div>
          </section>

          <section className="territory-section">
          <h3>Alertas de identidad (SIRI + SIGEP)</h3>
          <div className="territory-alerts">
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
          </section>
        </div>
      )}
    </div>
  );
}

function Metrica({ etiqueta, valor, alerta }: { etiqueta: string; valor: string; alerta?: boolean }) {
  return (
    <div className={`territory-metric${alerta ? ' territory-metric-alert' : ''}`}>
      <div>{etiqueta}</div>
      <strong>{valor}</strong>
    </div>
  );
}
import React from 'react';
