export interface ContratoInfo {
  idContrato: string;
  nombreEntidad: string;
  objetoDelContrato: string;
  descripcionDelProceso?: string;
  proveedorAdjudicado: string;
  nombreRepresentanteLegal?: string;
  nombreOrdenadorDelGasto?: string;
  nombreOrdenadorDePago?: string;
  nombreSupervisor?: string;
  estadoContrato: string;
  fechaDeFirma: string | null;
  fechaDeInicio: string | null;
  fechaDeFin: string | null;
  valorDelContrato: number;
  valorPagado?: number;
  valorPendientePago?: number;
  liquidado?: boolean;
  diasAdicionados?: number;
  destinoGasto?: string;
  origenDeLosRecursos?: string;
  urlProceso?: string;
}

const ESTADOS_PROBLEMA = ['cancelado', 'suspendido'];

export type SemaforoEstado = 'finalizado' | 'en_ejecucion' | 'vencido_sin_cerrar' | 'problema' | 'sin_iniciar' | 'desconocido';

export interface AnalisisTemporal {
  semaforo: SemaforoEstado;
  colorFondo: string;
  colorTexto: string;
  etiqueta: string;
  duracionLegible: string | null;
  porcentajeTiempo: number | null;
}

function normalizarEstado(estado: string): string {
  return (estado || '').toLowerCase().trim();
}

/** "437 días" -> "1 año 2 meses", legible para alguien que no piensa en días. */
export function duracionLegible(dias: number): string {
  if (dias < 30) return `${Math.round(dias)} día(s)`;
  const meses = Math.round(dias / 30.44);
  if (meses < 12) return `${meses} mes(es)`;
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  return mesesRestantes > 0 ? `${anios} año(s) ${mesesRestantes} mes(es)` : `${anios} año(s)`;
}

/**
 * Traduce fechas + estado crudo de SECOP a algo que un ciudadano común
 * entiende de un vistazo: ¿va bien, va tarde, ya terminó, hay un problema?
 * "Vencido sin cerrar" es la señal más útil para una veeduría: la fecha de
 * fin ya pasó pero el contrato no se liquidó. `liquidado` es la señal REAL
 * de SECOP (campo `liquidaci_n`) — se usa antes que adivinar por
 * `estadoContrato`, que es más un paso del flujo interno que un veredicto
 * final (ver mismo problema ya documentado con `estado_del_procedimiento`
 * de Procesos).
 */
export function analizarTiempo(c: ContratoInfo): AnalisisTemporal {
  const estado = normalizarEstado(c.estadoContrato);
  const inicio = c.fechaDeInicio ? new Date(c.fechaDeInicio) : null;
  const fin = c.fechaDeFin ? new Date(c.fechaDeFin) : null;
  const hoy = new Date();

  if (ESTADOS_PROBLEMA.includes(estado)) {
    return { semaforo: 'problema', colorFondo: '#fee2e2', colorTexto: '#991b1b', etiqueta: `⚠️ ${c.estadoContrato}`, duracionLegible: null, porcentajeTiempo: null };
  }

  if (c.liquidado) {
    const dias = inicio && fin ? (fin.getTime() - inicio.getTime()) / 86_400_000 : null;
    return {
      semaforo: 'finalizado',
      colorFondo: '#dcfce7',
      colorTexto: '#166534',
      etiqueta: '✅ Finalizado y liquidado',
      duracionLegible: dias !== null && dias > 0 ? `Duró ${duracionLegible(dias)}` : null,
      porcentajeTiempo: 100,
    };
  }

  if (!inicio) {
    return { semaforo: 'sin_iniciar', colorFondo: '#f4f4f4', colorTexto: '#666', etiqueta: c.estadoContrato || 'Sin definir', duracionLegible: null, porcentajeTiempo: null };
  }

  const diasTranscurridos = (hoy.getTime() - inicio.getTime()) / 86_400_000;

  if (fin && hoy.getTime() > fin.getTime()) {
    // La fecha de fin ya pasó y SECOP no lo marca como liquidado — bandera roja para veeduría.
    const diasVencido = (hoy.getTime() - fin.getTime()) / 86_400_000;
    return {
      semaforo: 'vencido_sin_cerrar',
      colorFondo: '#fef3c7',
      colorTexto: '#92400e',
      etiqueta: `🔴 Debía terminar hace ${duracionLegible(diasVencido)} y sigue sin liquidarse ("${c.estadoContrato}")`,
      duracionLegible: `Lleva ${duracionLegible(diasTranscurridos)} en total`,
      porcentajeTiempo: 100,
    };
  }

  const porcentajeTiempo = fin ? Math.min(100, Math.max(0, ((hoy.getTime() - inicio.getTime()) / (fin.getTime() - inicio.getTime())) * 100)) : null;
  return {
    semaforo: 'en_ejecucion',
    colorFondo: '#dbeafe',
    colorTexto: '#1e40af',
    etiqueta: `🔵 En ejecución — lleva ${duracionLegible(diasTranscurridos)}`,
    duracionLegible: null,
    porcentajeTiempo,
  };
}
