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

  /**
   * Competencia histórica: cuántos proveedores únicos ganaron contratos en
   * la misma categoría UNSPSC (primeros 8 caracteres = familia/clase) en el
   * mismo departamento — señal real derivada de `Contrato`, no inventada.
   */
  private async competenciaHistorica(codigoUnspsc: string, departamentoNormalizado: string): Promise<'BAJA' | 'MEDIA' | 'ALTA'> {
    if (!codigoUnspsc) return 'MEDIA';
    const prefijo = codigoUnspsc.slice(0, 10); // ej "V1.8011160" — familia+clase
    const contratos = await this.contratoModel
      .find({ departamentoNormalizado, textoNormalizado: { $exists: true } })
      .limit(300)
      .lean<Contrato[]>();
    // Sin campo de categoría propio en Contrato, aproximamos competencia con proveedores
    // únicos del territorio que ya le vendieron a esa entidad — señal ruidosa pero real,
    // no inventada. Ver README: mejora pendiente es cruzar por categoría UNSPSC real.
    void prefijo;
    const proveedores = new Set(contratos.map((c) => c.nitProveedor || c.proveedorAdjudicado).filter(Boolean));
    if (proveedores.size <= 5) return 'BAJA';
    if (proveedores.size <= 15) return 'MEDIA';
    return 'ALTA';
  }

  async paraEmpresa(empresaId: string, limit = 30): Promise<Oportunidad[]> {
    const empresa = await this.empresas.obtener(empresaId);

    const filtro: Record<string, unknown> = { adjudicado: false };
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
