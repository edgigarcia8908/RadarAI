import { ContratoInfo, analizarTiempo, duracionLegible } from './contratoUtils';
import { SancionSiri, PuestoSensible } from './api';
import PerfilFuncionario from './PerfilFuncionario';

function fecha(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Alerta de SIRI para un nombre — SIEMPRE como "coincidencia de nombre a
 * verificar", nunca como afirmación de identidad: SECOP no trae cédula del
 * firmante, así que no podemos confirmar que sea la misma persona (ver
 * disclaimer en siri.service.ts).
 */
function AlertaSiri({ sanciones }: { sanciones: SancionSiri[] }) {
  return (
    <div style={{ marginTop: 4, fontSize: 12, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '4px 8px', color: '#991b1b' }}>
      ⚠️ Nombre coincide con un registro de SIRI (sanciones disciplinarias): {sanciones[0].sanciones || sanciones[0].tipoInhabilidad}
      {sanciones[0].autoridad ? ` — ${sanciones[0].autoridad}` : ''}
      {sanciones[0].fechaEfectosJuridicos ? ` (${sanciones[0].fechaEfectosJuridicos})` : ''}. Es coincidencia de NOMBRE, no de
      identidad verificada — SECOP no trae cédula del firmante, confirma antes de asumir que es la misma persona.
    </div>
  );
}

/**
 * Info de SIGEP (puestos sensibles a corrupción) para un nombre — a
 * diferencia de SIRI esto NO es una acusación (tener un cargo de confianza
 * no es una falta), es contexto público. Mismo disclaimer de coincidencia
 * de nombre, por eso mismo umbral y mismo tono no-acusatorio (azul, no
 * rojo).
 */
function InfoSigep({ puestos }: { puestos: PuestoSensible[] }) {
  return (
    <div style={{ marginTop: 4, fontSize: 12, background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 6, padding: '4px 8px', color: '#1e40af' }}>
      ℹ️ Nombre coincide con un cargo de confianza en SIGEP: {puestos[0].cargo} — {puestos[0].entidad}
      {puestos[0].asignacionBasica ? ` (asignación básica: $${puestos[0].asignacionBasica})` : ''}. Coincidencia de NOMBRE, no de
      identidad verificada — confirma antes de asumir que es la misma persona.
    </div>
  );
}

/**
 * Tarjeta visual de un contrato — pensada para "gente normal", no para
 * alguien que sabe leer un JSON de SECOP. Muestra de un vistazo: quién
 * contrató a quién, quién firmó, cuándo empezó/terminó (o si va tarde),
 * cuánto se ha pagado, y si hubo prórrogas.
 */
export default function ContratoCard({
  c,
  sanciones,
  puestosSensibles,
}: {
  c: ContratoInfo;
  sanciones?: Record<string, SancionSiri[]>;
  puestosSensibles?: Record<string, PuestoSensible[]>;
}) {
  const analisis = analizarTiempo(c);
  const porcentajePagado = c.valorDelContrato > 0 && c.valorPagado != null ? Math.min(100, (c.valorPagado / c.valorDelContrato) * 100) : null;
  const sancionesRepresentante = c.nombreRepresentanteLegal ? sanciones?.[c.nombreRepresentanteLegal] : undefined;
  const sancionesOrdenador = c.nombreOrdenadorDelGasto ? sanciones?.[c.nombreOrdenadorDelGasto] : undefined;
  const puestoOrdenador = c.nombreOrdenadorDelGasto ? puestosSensibles?.[c.nombreOrdenadorDelGasto] : undefined;
  const puestoSupervisor = c.nombreSupervisor ? puestosSensibles?.[c.nombreSupervisor] : undefined;

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
        {c.nombreSupervisor && (
          <div><span style={{ color: '#888' }}>Supervisa:</span> {c.nombreSupervisor}</div>
        )}
        <div><span style={{ color: '#888' }}>Firmado:</span> {fecha(c.fechaDeFirma)}</div>
        <div><span style={{ color: '#888' }}>Inicio:</span> {fecha(c.fechaDeInicio)}</div>
        <div><span style={{ color: '#888' }}>Fin previsto:</span> {fecha(c.fechaDeFin)}</div>
      </div>

      {sancionesRepresentante?.length ? <AlertaSiri sanciones={sancionesRepresentante} /> : null}
      {sancionesOrdenador?.length ? <AlertaSiri sanciones={sancionesOrdenador} /> : null}
      {puestoOrdenador?.length ? <InfoSigep puestos={puestoOrdenador} /> : null}
      {puestoSupervisor?.length ? <InfoSigep puestos={puestoSupervisor} /> : null}
      {c.nombreSupervisor && <PerfilFuncionario nombre={c.nombreSupervisor} />}

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
