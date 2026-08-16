import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';
import { SocrataClient, soqlString, toNumber } from '../ingestion/socrata.client';
import { normalizar } from '../common/normalizar';
import { departamentoRealSecop } from '../common/departamento-secop';
import { valorPlausible } from '../common/valores';
import { formatearPesos } from '../common/formatear-pesos';

/**
 * CUIPO (Categorización Única de Información de Presupuesto y de Operaciones
 * de las Entidades Territoriales) — datasets del OVCF/Contraloría en
 * datos.gov.co, mismo mecanismo que SECOP (Socrata). Reporta por `periodo`
 * como CORTE ACUMULADO del año fiscal (no incremental) — sumar varios
 * periodos de una misma entidad duplicaría plata. Por eso: se busca el
 * periodo MÁS RECIENTE dentro del rango pedido y se suma solo ese corte
 * entre todas las cuentas presupuestales.
 */
const DATASET_PROGRAMACION_GASTOS = 'd9mu-h6ar';
const DATASET_EJECUCION_GASTOS = '4f7r-epif';

function fechaAPeriodo(fecha: string): string {
  return fecha.replace(/-/g, '');
}

export interface PresupuestoEntidadInput {
  departamento?: string;
  ciudad: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface EstadoPresupuestal {
  entidad: string;
  periodoConsultado: string | null;
  presupuestoApropiado: number;
  comprometido: number;
  obligado: number;
  pagado: number;
  porcentajeComprometido: number | null;
  porcentajePagado: number | null;
  valorContratadoSecop: number;
  diferenciaContratadoVsComprometido: number;
  alerta: string | null;
  mensaje?: string;
}

@Injectable()
export class CuipoService {
  private readonly logger = new Logger(CuipoService.name);
  private readonly clienteProgramacion = new SocrataClient(DATASET_PROGRAMACION_GASTOS);
  private readonly clienteEjecucion = new SocrataClient(DATASET_EJECUCION_GASTOS);

  constructor(@InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>) {}

  /** Encuentra el corte de reporte más reciente <= fechaHasta (o el más reciente disponible si no hay rango). */
  private async periodoMasReciente(cliente: SocrataClient, entidad: string, fechaHasta?: string): Promise<string | null> {
    const where = [`upper(nombre_entidad) = upper('${soqlString(entidad)}')`];
    if (fechaHasta) where.push(`periodo <= '${fechaAPeriodo(fechaHasta)}'`);
    const filas = await cliente.fetchRows({ select: 'max(periodo) as maxp', where });
    const maxp = filas[0]?.maxp;
    return typeof maxp === 'string' && maxp ? maxp : null;
  }

  private async sumarPeriodo(cliente: SocrataClient, entidad: string, periodo: string, columnas: string[]): Promise<Record<string, number>> {
    const select = columnas.map((c) => `sum(${c}) as ${c}`).join(', ');
    const where = [`upper(nombre_entidad) = upper('${soqlString(entidad)}')`, `periodo = '${periodo}'`];
    const filas = await cliente.fetchRows({ select, where });
    const fila = filas[0] ?? {};
    const resultado: Record<string, number> = {};
    for (const c of columnas) resultado[c] = toNumber(fila[c]);
    return resultado;
  }

  /**
   * Compara lo presupuestado/comprometido en CUIPO contra lo que ya tenemos
   * sincronizado de SECOP para el mismo municipio — ¿hay contratos que no
   * se reflejan en el presupuesto, o un presupuesto mucho mayor a lo
   * contratado (posible subejecución)?
   */
  async obtenerPresupuesto(input: PresupuestoEntidadInput): Promise<EstadoPresupuestal> {
    const entidad = input.ciudad.trim();
    const departamentoReal = departamentoRealSecop(input.departamento, input.ciudad);

    let periodo: string | null;
    try {
      periodo = await this.periodoMasReciente(this.clienteEjecucion, entidad, input.fechaHasta);
    } catch (err) {
      this.logger.warn(`CUIPO no disponible para "${entidad}": ${(err as Error).message}`);
      periodo = null;
    }

    const filtroContrato: Record<string, unknown> = { ciudadNormalizado: normalizar(entidad) };
    if (departamentoReal) filtroContrato.departamentoNormalizado = normalizar(departamentoReal);
    if (input.fechaDesde || input.fechaHasta) {
      const rango: Record<string, Date> = {};
      if (input.fechaDesde) rango.$gte = new Date(`${input.fechaDesde}T00:00:00`);
      if (input.fechaHasta) rango.$lte = new Date(`${input.fechaHasta}T23:59:59`);
      filtroContrato.fechaDeFirma = rango;
    }
    const contratosSecop = await this.contratoModel.find(filtroContrato).lean<Contrato[]>();
    const valorContratadoSecop = contratosSecop.reduce((s, c) => s + valorPlausible(c.valorDelContrato), 0);

    if (!periodo) {
      return {
        entidad,
        periodoConsultado: null,
        presupuestoApropiado: 0,
        comprometido: 0,
        obligado: 0,
        pagado: 0,
        porcentajeComprometido: null,
        porcentajePagado: null,
        valorContratadoSecop,
        diferenciaContratadoVsComprometido: 0,
        alerta: null,
        mensaje: `No encontramos reportes de presupuesto CUIPO para "${entidad}" — puede que la entidad no reporte a este sistema o que el nombre no coincida exactamente.`,
      };
    }

    const [apropiacion, ejecucion] = await Promise.all([
      this.sumarPeriodo(this.clienteProgramacion, entidad, periodo, ['apropiacion_definitiva']),
      this.sumarPeriodo(this.clienteEjecucion, entidad, periodo, ['compromisos', 'obligaciones', 'pagos']),
    ]);

    const presupuestoApropiado = apropiacion.apropiacion_definitiva || 0;
    const comprometido = ejecucion.compromisos || 0;
    const obligado = ejecucion.obligaciones || 0;
    const pagado = ejecucion.pagos || 0;

    const porcentajeComprometido = presupuestoApropiado > 0 ? (comprometido / presupuestoApropiado) * 100 : null;
    const porcentajePagado = presupuestoApropiado > 0 ? (pagado / presupuestoApropiado) * 100 : null;
    const diferenciaContratadoVsComprometido = valorContratadoSecop - comprometido;

    let alerta: string | null = null;
    if (comprometido > 0 && valorContratadoSecop > comprometido * 1.5) {
      alerta = `Lo sincronizado de SECOP para este territorio/periodo (${formatearPesos(valorContratadoSecop)}) supera claramente lo comprometido reportado en CUIPO (${formatearPesos(comprometido)}) — puede deberse a que el filtro de SECOP incluye más entidades que la reportante, o merece revisión.`;
    } else if (porcentajeComprometido !== null && porcentajeComprometido > 100) {
      alerta = `El municipio comprometió ${porcentajeComprometido.toFixed(0)}% de su presupuesto apropiado — más del 100%, revisar si hubo adiciones presupuestales que lo justifiquen.`;
    }

    return {
      entidad,
      periodoConsultado: periodo,
      presupuestoApropiado,
      comprometido,
      obligado,
      pagado,
      porcentajeComprometido,
      porcentajePagado,
      valorContratadoSecop,
      diferenciaContratadoVsComprometido,
      alerta,
    };
  }
}
