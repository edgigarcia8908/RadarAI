import { Injectable, Logger } from '@nestjs/common';
import { SocrataClient, soqlString, toNumber } from '../ingestion/socrata.client';
import { normalizar } from '../common/normalizar';
import { completar } from '../lib/llm';
import { PreguntaActualidadDto } from './dto/pregunta-actualidad.dto';

/** Desglose de una ciudad por estado del procedimiento (SECOP II). */
export interface EstadoPorCiudad {
  estado: string;
  total: number;
  presupuesto: number;
}

/** Radiografía de un municipio: totales y desglose por estado. */
export interface MunicipioRadiografia {
  ciudad: string;
  totalProcesos: number;
  presupuesto: number;
  porEstado: EstadoPorCiudad[];
}

/** Municipio con procesos en ejecución real (presupuesto activo > 0). */
export interface FocoEjecucion {
  ciudad: string;
  procesosActivos: number;
  presupuesto: number;
}

/** Municipio con procesos solo en planeación (nada activo con presupuesto). */
export interface MunicipioEstancado {
  ciudad: string;
  procesosPlaneacion: number;
  presupuesto: number;
}

/** Municipio solo con procesos parados (o sin presupuesto en ningún estado activo). */
export interface MunicipioRiesgo {
  ciudad: string;
  procesosParados: number;
}

/** Estructura que consume el LLM y la plantilla de respaldo para redactar el reporte. */
export interface Radiografia {
  totalProcesos: number;
  presupuestoTotal: number;
  municipios: MunicipioRadiografia[];
  focosEjecucion: FocoEjecucion[];
  estancados: MunicipioEstancado[];
  riesgo: MunicipioRiesgo[];
}

type ClasificacionEstado = 'ACTIVO' | 'PLANEACION' | 'PARADO';

/** Estados que en SECOP II significan obra/proceso realmente en marcha. */
const ESTADOS_ACTIVOS = ['en ejecucion', 'adjudicado', 'celebrado'];
/** Estados que en SECOP II significan proceso detenido. */
const ESTADOS_PARADOS = ['cancelado', 'suspendido'];

/**
 * Clasifica el `estado_del_procedimiento` de SECOP II sin importar cómo lo
 * escribió cada entidad (tildes/mayúsculas). Cualquier estado no reconocido
 * cae a PLANEACION: es la decisión conservadora — si no podemos probar que
 * algo ya se ejecuta o se canceló, lo tratamos como que todavía no arranca.
 */
function clasificarEstado(estado: string): ClasificacionEstado {
  const normalizado = normalizar(estado);
  if (ESTADOS_ACTIVOS.includes(normalizado)) return 'ACTIVO';
  if (ESTADOS_PARADOS.includes(normalizado)) return 'PARADO';
  return 'PLANEACION';
}

/**
 * Transforma las filas de la agregación SoQL de SECOP II en la radiografía
 * estructurada del territorio. Pura (sin red, sin estado) para poder testearla
 * en aislamiento.
 *
 * Reglas de clasificación por municipio (en orden de prioridad, cada municipio
 * cae en exactamente una lista):
 * - focoEjecucion: tiene estados ACTIVOS con presupuesto > 0.
 * - estancado: tiene procesos en PLANEACION y NO tiene ACTIVOS con presupuesto > 0.
 * - riesgo: el resto — solo estados PARADOS o procesos sin presupuesto activo.
 */
export function construirRadiografia(rows: Record<string, any>[]): Radiografia {
  const porCiudad = new Map<
    string,
    {
      ciudad: string;
      totalProcesos: number;
      presupuesto: number;
      porEstado: Map<string, { total: number; presupuesto: number }>;
      activos: { procesos: number; presupuesto: number };
      planeacion: { procesos: number; presupuesto: number };
      parados: number;
    }
  >();

  for (const row of rows) {
    const ciudad = String(row.ciudad_entidad ?? 'Sin información');
    const total = toNumber(row.total_procesos);
    const presupuesto = toNumber(row.presupuesto);
    const estado = String(row.estado_del_procedimiento ?? 'Sin información');

    let entry = porCiudad.get(ciudad);
    if (!entry) {
      entry = {
        ciudad,
        totalProcesos: 0,
        presupuesto: 0,
        porEstado: new Map(),
        activos: { procesos: 0, presupuesto: 0 },
        planeacion: { procesos: 0, presupuesto: 0 },
        parados: 0,
      };
      porCiudad.set(ciudad, entry);
    }
    entry.totalProcesos += total;
    entry.presupuesto += presupuesto;

    const desglose = entry.porEstado.get(estado) ?? { total: 0, presupuesto: 0 };
    desglose.total += total;
    desglose.presupuesto += presupuesto;
    entry.porEstado.set(estado, desglose);

    const clasificacion = clasificarEstado(estado);
    if (clasificacion === 'ACTIVO') {
      entry.activos.procesos += total;
      entry.activos.presupuesto += presupuesto;
    } else if (clasificacion === 'PARADO') {
      entry.parados += total;
    } else {
      entry.planeacion.procesos += total;
      entry.planeacion.presupuesto += presupuesto;
    }
  }

  const focosEjecucion: FocoEjecucion[] = [];
  const estancados: MunicipioEstancado[] = [];
  const riesgo: MunicipioRiesgo[] = [];

  const municipios: MunicipioRadiografia[] = [...porCiudad.values()].map((entry) => {
    if (entry.activos.presupuesto > 0) {
      focosEjecucion.push({ ciudad: entry.ciudad, procesosActivos: entry.activos.procesos, presupuesto: entry.activos.presupuesto });
    } else if (entry.planeacion.procesos > 0) {
      estancados.push({ ciudad: entry.ciudad, procesosPlaneacion: entry.planeacion.procesos, presupuesto: entry.planeacion.presupuesto });
    } else {
      riesgo.push({ ciudad: entry.ciudad, procesosParados: entry.parados });
    }

    return {
      ciudad: entry.ciudad,
      totalProcesos: entry.totalProcesos,
      presupuesto: entry.presupuesto,
      porEstado: [...entry.porEstado.entries()]
        .map(([estado, v]) => ({ estado, total: v.total, presupuesto: v.presupuesto }))
        .sort((a, b) => b.total - a.total),
    };
  });

  return {
    totalProcesos: municipios.reduce((s, m) => s + m.totalProcesos, 0),
    presupuestoTotal: municipios.reduce((s, m) => s + m.presupuesto, 0),
    municipios: municipios.sort((a, b) => b.presupuesto - a.presupuesto),
    focosEjecucion: focosEjecucion.sort((a, b) => b.presupuesto - a.presupuesto),
    estancados: estancados.sort((a, b) => b.presupuesto - a.presupuesto),
    riesgo: riesgo.sort((a, b) => b.procesosParados - a.procesosParados),
  };
}

@Injectable()
export class SituacionService {
  private readonly logger = new Logger(SituacionService.name);
  private readonly socrata = new SocrataClient('p6dx-8zbt'); // SECOP II

  /**
   * Radiografía de "situación actual" del departamento: agrega procesos de
   * SECOP II por municipio/estado, clasifica focos de ejecución/estancados/
   * riesgo y redacta el reporte con LLM (con plantilla de respaldo).
   */
  async consultar(input: PreguntaActualidadDto) {
    const departamento = input.departamento_afectado;
    const rows = await this.socrata.aggregate({
      select: ['ciudad_entidad', 'estado_del_procedimiento', 'count(*) as total_procesos', 'sum(precio_base) as presupuesto'],
      group: ['ciudad_entidad', 'estado_del_procedimiento'],
      where: [this.filtroDepartamento(departamento)],
      order: 'presupuesto DESC',
      limit: 200,
    });

    const radiografia = construirRadiografia(rows);
    const respuesta = await this.redactarRespuesta(departamento, input.pregunta, radiografia);

    return {
      departamento,
      pregunta: input.pregunta,
      radiografia,
      respuesta,
      consultadoEn: new Date().toISOString(),
    };
  }

  /**
   * Filtro de departamento robusto ante tildes: en SECOP II
   * `departamento_entidad` está en mayúsculas pero un mismo departamento
   * puede aparecer con o sin tilde según la entidad (ej. 'QUINDÍO' vs
   * 'QUINDIO'). Genera ambas variantes y las escapa con `soqlString` para
   * no abrir paso a inyección.
   */
  private filtroDepartamento(departamento: string): string {
    const variantes = [...new Set([departamento.toUpperCase(), normalizar(departamento).toUpperCase()])];
    const valores = variantes.map((v) => `'${soqlString(v)}'`).join(', ');
    return `upper(departamento_entidad) IN (${valores})`;
  }

  /** Redacta el reporte con IA si hay API key; si no (o si falla), usa una plantilla simple en español. */
  private async redactarRespuesta(departamento: string, pregunta: string, radiografia: Radiografia): Promise<string> {
    const plantilla = () => {
      const foco = radiografia.focosEjecucion[0];
      const estancado = radiografia.estancados[0];
      const enRiesgo = radiografia.riesgo[0];
      const veredicto = radiografia.riesgo.length
        ? 'se detectan procesos en riesgo y proyectos estancados — conviene seguimiento de veeduría.'
        : 'sin señales críticas con los datos disponibles.';
      const partes = [
        `📢 Reporte de Situación Cívico de ${departamento}: ${radiografia.totalProcesos} procesos por $${radiografia.presupuestoTotal.toLocaleString('es-CO')} en total.`,
      ];
      if (foco) partes.push(`📍 ${foco.ciudad} es el principal foco de ejecución con ${foco.procesosActivos} procesos activos por $${foco.presupuesto.toLocaleString('es-CO')}.`);
      if (estancado) partes.push(`📍 ${estancado.ciudad} acumula ${estancado.procesosPlaneacion} procesos en planeación por $${estancado.presupuesto.toLocaleString('es-CO')}.`);
      if (enRiesgo) partes.push(`📍 ${enRiesgo.ciudad} presenta ${enRiesgo.procesosParados} procesos parados.`);
      partes.push(`🛡️ Veredicto: ${veredicto}`);
      return partes.join(' ');
    };

    try {
      const respuesta = await completar({
        system:
          'Sos el asistente cívico de RADAR. Redactás un Reporte de Situación Cívico en español, tono de veeduría ciudadana, claro para un ciudadano sin conocimientos técnicos de contratación pública. Estructura: abre con "📢 Reporte de Situación Cívico", luego una zona "📍" por cada municipio relevante indicando si es foco de ejecución, está estancado o en riesgo (basate en las listas focosEjecucion/estancados/riesgo), y cerrá con "🛡️ Veredicto" y una recomendación accionable para una veeduría. Basate SOLO en los datos provistos: no inventes cifras ni municipios que no aparezcan.',
        prompt: `Pregunta del ciudadano: "${pregunta}"\n\nRadiografía del departamento ${departamento}: ${JSON.stringify(radiografia)}`,
        maxTokens: 800,
      });
      return respuesta ?? plantilla();
    } catch (err) {
      this.logger.warn(`No se pudo redactar con IA: ${(err as Error).message}`);
      return plantilla();
    }
  }
}