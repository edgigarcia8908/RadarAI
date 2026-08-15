import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proceso } from '../ingestion/proceso.schema';
import { Contrato } from '../ingestion/contrato.schema';
import { Empresa } from '../empresas/empresa.schema';
import { EmpresasService } from '../empresas/empresas.service';
import { normalizar } from '../common/normalizar';

export interface Oportunidad {
  proceso: Proceso;
  compatibilidad: number; // 0-100
  competencia: 'BAJA' | 'MEDIA' | 'ALTA';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  porQue: string[];
}

/**
 * Motor de matching Empresa↔Proceso. Mismo espíritu que
 * `ceo-ecosistema/src/matching/matching.service.ts` (Fase 1: sin
 * embeddings, a propósito — el reemplazo natural es similitud semántica vía
 * `ceo-intelligence-service`, documentado en el README) pero aplicado a
 * texto libre (palabras clave) en vez de tags exactos, porque los procesos
 * de SECOP no tienen tags — solo `nombreProcedimiento`/`descripcionProcedimiento`.
 */
@Injectable()
export class OportunidadesService {
  constructor(
    @InjectModel(Proceso.name) private readonly procesoModel: Model<Proceso>,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
    @Inject(EmpresasService) private readonly empresas: EmpresasService,
  ) {}

  /** Fracción de `palabrasClave` de la empresa que aparecen en el texto normalizado del proceso. */
  private compatibilidadProducto(palabrasClave: string[], textoNormalizado: string): number {
    if (!palabrasClave.length) return 0;
    const encontradas = palabrasClave.filter((p) => textoNormalizado.includes(p));
    return encontradas.length / palabrasClave.length;
  }

  private compatibilidadTerritorio(empresa: Empresa, proceso: Proceso): number {
    const sinRestriccion = empresa.departamentos.length === 0;
    if (sinRestriccion) return 0.5; // no descarta, pero no suma tanto como un match explícito
    const deptoOk = empresa.departamentos.some((d) => normalizar(d) === proceso.departamentoEntidadNormalizado);
    if (!deptoOk) return 0;
    if (empresa.ciudades.length === 0) return 1;
    return empresa.ciudades.some((c) => normalizar(c) === proceso.ciudadEntidadNormalizado) ? 1 : 0.7;
  }

  /** UNSPSC viene como "V1.70151802" (prefijo de versión + 8 dígitos: segmento-familia-clase-producto). "Familia+clase" = los primeros 6 dígitos después del prefijo — suficientemente específico sin ser tan estrecho como el producto exacto. */
  private familiaClaseUnspsc(codigo: string): string {
    const digitos = codigo.replace(/^V\d+\./, '');
    return digitos.slice(0, 6);
  }

  /**
   * Competencia histórica: proveedores únicos que YA ganaron contratos en la
   * MISMA familia+clase UNSPSC en el mismo departamento — señal real
   * derivada de `Contrato.codigoCategoriaUnspsc`, cruzada por categoría (no
   * solo por territorio como antes). Si el proceso no trae UNSPSC o no hay
   * contratos históricos de esa categoría en la zona, cae a 'MEDIA' — ni
   * optimista ni pesimista sin evidencia.
   */
  private async competenciaHistorica(codigoUnspsc: string, departamentoNormalizado: string): Promise<'BAJA' | 'MEDIA' | 'ALTA'> {
    if (!codigoUnspsc) return 'MEDIA';
    const familiaClase = this.familiaClaseUnspsc(codigoUnspsc);
    if (!familiaClase) return 'MEDIA';

    const contratos = await this.contratoModel
      .find({ departamentoNormalizado, codigoCategoriaUnspsc: new RegExp(`^V\\d+\\.${familiaClase}`) })
      .limit(300)
      .lean<Contrato[]>();

    if (contratos.length === 0) return 'MEDIA'; // sin histórico de esta categoría en la zona — no hay evidencia para decir baja o alta
    const proveedores = new Set(contratos.map((c) => c.nitProveedor || c.proveedorAdjudicado).filter(Boolean));
    if (proveedores.size <= 3) return 'BAJA';
    if (proveedores.size <= 8) return 'MEDIA';
    return 'ALTA';
  }

  async paraEmpresa(empresaId: string, limit = 30): Promise<Oportunidad[]> {
    const empresa = await this.empresas.obtener(empresaId);

    // "Oportunidad real" = SECOP todavía acepta algo en este proceso
    // (`estadoApertura: 'Abierto'`, señal real y verificada — ver comentario
    // en proceso.schema.ts) Y no está cancelado/en borrador (esos SÍ pueden
    // venir con estadoApertura='Abierto' en SECOP, pero no son biddable) Y
    // no adjudicado. `estadoProcedimiento: 'Seleccionado'` se incluye a
    // propósito — NO significa "proveedor ya elegido" en SECOP, es una fase
    // administrativa (verificado: la mayoría de "Seleccionado" siguen
    // abiertos a ofertas).
    const filtro: Record<string, unknown> = {
      adjudicado: false,
      estadoApertura: 'Abierto',
      estadoProcedimiento: { $nin: ['Cancelado', 'Borrador'] },
    };
    if (empresa.departamentos.length) {
      filtro.departamentoEntidadNormalizado = { $in: empresa.departamentos.map((d) => normalizar(d)) };
    }

    const procesos = await this.procesoModel.find(filtro).sort({ fechaPublicacion: -1 }).limit(300).lean<Proceso[]>();

    const candidatos = procesos
      .map((proceso) => {
        const compProducto = this.compatibilidadProducto(empresa.palabrasClave, proceso.textoNormalizado || '');
        const compTerritorio = this.compatibilidadTerritorio(empresa, proceso);
        const compatibilidad = Math.round((compProducto * 0.7 + compTerritorio * 0.3) * 100);
        return { proceso, compProducto, compTerritorio, compatibilidad };
      })
      .filter((c) => c.compProducto > 0) // sin ningún término de producto en común, no es una oportunidad real
      .sort((a, b) => b.compatibilidad - a.compatibilidad)
      .slice(0, limit);

    const oportunidades: Oportunidad[] = [];
    for (const c of candidatos) {
      const competencia = await this.competenciaHistorica(c.proceso.codigoCategoriaUnspsc, c.proceso.departamentoEntidadNormalizado);
      const prioridad = this.prioridad(c.compatibilidad, competencia);
      const porQue: string[] = [];
      if (c.compProducto > 0) porQue.push(`Producto/servicio compatible (${Math.round(c.compProducto * 100)}% de tus palabras clave aparecen en el objeto del proceso)`);
      if (c.compTerritorio >= 1) porQue.push('Territorio seleccionado');
      else if (c.compTerritorio > 0) porQue.push('Territorio parcialmente compatible');
      porQue.push(`Competencia histórica ${competencia.toLowerCase()} en la zona`);
      porQue.push(`Proceso abierto en SECOP (fase: ${c.proceso.fase || c.proceso.estadoProcedimiento})`);

      oportunidades.push({ proceso: c.proceso, compatibilidad: c.compatibilidad, competencia, prioridad, porQue });
    }

    return oportunidades;
  }

  private prioridad(compatibilidad: number, competencia: 'BAJA' | 'MEDIA' | 'ALTA'): 'ALTA' | 'MEDIA' | 'BAJA' {
    if (compatibilidad >= 70 && competencia !== 'ALTA') return 'ALTA';
    if (compatibilidad >= 40) return 'MEDIA';
    return 'BAJA';
  }
}
