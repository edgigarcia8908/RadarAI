import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';
import { normalizar } from '../common/normalizar';
import { palabrasConSinonimos } from '../common/sinonimos';
import { departamentoRealSecop } from '../common/departamento-secop';

export interface EstudioMercadoInput {
  objeto: string;
  departamento?: string;
  ciudad?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

/**
 * Estados de `Contrato.estadoContrato` que consideramos "ya terminado" —
 * verificado a mano contra datos reales (ver README): SECOP no tiene un
 * estado literal "liquidado" en este dataset, `terminado`/`Cerrado` son lo
 * más cercano disponible. Un contrato "En ejecución" o "Aprobado" todavía
 * puede cambiar de valor/plazo, así que no sirve como referencia de precio
 * de mercado.
 */
const ESTADOS_TERMINADOS = ['terminado', 'cerrado', 'cedido'];

@Injectable()
export class EstudiosMercadoService {
  constructor(@InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>) {}

  /**
   * Estudio de mercado: para una entidad que va a contratar algo, ¿qué pagó
   * el resto del Estado por lo mismo, con quién, y en cuánto tiempo? Reusa
   * los datos ya sincronizados (no vuelve a pegarle a Socrata) — pensado
   * para correr DESPUÉS de sincronizar el territorio/tema de interés desde
   * el flujo ciudadano o empresa.
   */
  async generarEstudio(input: EstudioMercadoInput) {
    const departamentoReal = departamentoRealSecop(input.departamento, input.ciudad);
    const palabras = palabrasConSinonimos(input.objeto);
    const filtro: Record<string, unknown> = {
      estadoContrato: { $in: ESTADOS_TERMINADOS.map((e) => new RegExp(`^${e}$`, 'i')) },
    };
    if (departamentoReal) filtro.departamentoNormalizado = normalizar(departamentoReal);
    if (input.ciudad) filtro.ciudadNormalizado = normalizar(input.ciudad);
    if (palabras.length) filtro.textoNormalizado = new RegExp(palabras.join('|'), 'i');
    if (input.fechaDesde || input.fechaHasta) {
      const rango: Record<string, Date> = {};
      if (input.fechaDesde) rango.$gte = new Date(`${input.fechaDesde}T00:00:00`);
      if (input.fechaHasta) rango.$lte = new Date(`${input.fechaHasta}T23:59:59`);
      filtro.fechaDeFirma = rango;
    }

    const contratos = await this.contratoModel.find(filtro).sort({ fechaDeFirma: -1 }).limit(300).lean<Contrato[]>();

    if (contratos.length === 0) {
      return {
        totalContratos: 0,
        mensaje:
          'No hay contratos terminados/cerrados que coincidan con esa búsqueda en lo ya sincronizado — probá sincronizar más territorio/rango de fechas primero, o describir el objeto con otras palabras.',
      };
    }

    const valores = contratos.map((c) => c.valorDelContrato).filter((v) => v > 0).sort((a, b) => a - b);
    const valorMinimo = valores[0] ?? 0;
    const valorMaximo = valores[valores.length - 1] ?? 0;
    const valorPromedio = valores.length ? Math.round(valores.reduce((s, v) => s + v, 0) / valores.length) : 0;
    const valorMediana = valores.length ? valores[Math.floor(valores.length / 2)] : 0;

    const duraciones = contratos
      .map((c) => (c.fechaDeInicio && c.fechaDeFin ? (c.fechaDeFin.getTime() - c.fechaDeInicio.getTime()) / 86_400_000 : null))
      .filter((d): d is number => d !== null && d > 0);
    const duracionPromedioDias = duraciones.length ? Math.round(duraciones.reduce((s, d) => s + d, 0) / duraciones.length) : null;

    const porProveedor = new Map<string, { nombre: string; contratos: number; valorTotal: number }>();
    for (const c of contratos) {
      const key = c.nitProveedor || c.proveedorAdjudicado;
      if (!key) continue;
      if (!porProveedor.has(key)) porProveedor.set(key, { nombre: c.proveedorAdjudicado, contratos: 0, valorTotal: 0 });
      const entry = porProveedor.get(key)!;
      entry.contratos++;
      entry.valorTotal += c.valorDelContrato || 0;
    }
    const proveedoresFrecuentes = [...porProveedor.values()].sort((a, b) => b.contratos - a.contratos).slice(0, 10);

    return {
      totalContratos: contratos.length,
      valorMinimo,
      valorMaximo,
      valorPromedio,
      valorMediana,
      duracionPromedioDias,
      proveedoresUnicos: porProveedor.size,
      proveedoresFrecuentes,
      contratosComparables: contratos.slice(0, 30).map((c) => ({
        idContrato: c.idContrato,
        nombreEntidad: c.nombreEntidad,
        objetoDelContrato: c.objetoDelContrato,
        proveedorAdjudicado: c.proveedorAdjudicado,
        nombreRepresentanteLegal: c.nombreRepresentanteLegal,
        nombreOrdenadorDelGasto: c.nombreOrdenadorDelGasto,
        valorDelContrato: c.valorDelContrato,
        valorPagado: c.valorPagado,
        liquidado: c.liquidado,
        diasAdicionados: c.diasAdicionados,
        destinoGasto: c.destinoGasto,
        origenDeLosRecursos: c.origenDeLosRecursos,
        fechaDeFirma: c.fechaDeFirma,
        fechaDeInicio: c.fechaDeInicio,
        fechaDeFin: c.fechaDeFin,
        estadoContrato: c.estadoContrato,
        urlProceso: c.urlProceso,
      })),
    };
  }
}
