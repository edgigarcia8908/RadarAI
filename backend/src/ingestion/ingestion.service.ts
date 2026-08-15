import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proceso } from './proceso.schema';
import { Contrato } from './contrato.schema';
import { SocrataClient, soqlString, toDate, toNumber } from './socrata.client';
import { normalizar } from '../common/normalizar';

/** Datasets reales de datos.gov.co — ver README de RadarAI para el análisis completo. */
const DATASET_PROCESOS = 'p6dx-8zbt'; // SECOP II - Procesos de Contratación
const DATASET_CONTRATOS = 'jbjy-vk9h'; // SECOP II - Contratos Electrónicos

export interface FiltroTerritorio {
  departamento?: string;
  ciudad?: string;
  /** Texto libre: se manda como $q de Socrata (full-text sobre todas las columnas). */
  tema?: string;
  /** 'YYYY-MM-DD'. Sin esto, Socrata devuelve por defecto lo más reciente por fecha, pero puede incluir contratos de años viejos si hay poco volumen reciente en el territorio — mejor filtrar explícito. */
  fechaDesde?: string;
  fechaHasta?: string;
  limit?: number;
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly procesosClient = new SocrataClient(DATASET_PROCESOS);
  private readonly contratosClient = new SocrataClient(DATASET_CONTRATOS);

  constructor(
    @InjectModel(Proceso.name) private readonly procesoModel: Model<Proceso>,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
  ) {}

  /**
   * Filtramos por departamento Y ciudad directo en Socrata con `upper()` —
   * verificado a mano (ver README): el campo ciudad en SECOP viene
   * consistentemente acentuado igual que el nombre oficial DANE que usa
   * nuestro propio selector (`frontend/src/colombia.json`), así que
   * `upper()` alcanza para igualarlos sin falsos negativos. Igual guardamos
   * los campos *Normalizado (sin tildes/mayúsculas) como respaldo para el
   * matching de `tema` en Mongo, donde SECOP sí es inconsistente (objetos
   * contractuales en mayúsculas, sin tildes, etc. — ahí `upper()` no
   * alcanza porque el problema no es solo mayúsculas sino tildes).
   */
  private construirWhere(
    filtro: FiltroTerritorio,
    campoDepartamento: string,
    campoCiudad: string,
    campoFecha: string,
  ): string[] {
    const where: string[] = [];
    if (filtro.departamento) where.push(`upper(${campoDepartamento}) = upper('${soqlString(filtro.departamento)}')`);
    if (filtro.ciudad) where.push(`upper(${campoCiudad}) = upper('${soqlString(filtro.ciudad)}')`);
    if (filtro.fechaDesde) where.push(`${campoFecha} >= '${soqlString(filtro.fechaDesde)}T00:00:00'`);
    if (filtro.fechaHasta) where.push(`${campoFecha} <= '${soqlString(filtro.fechaHasta)}T23:59:59'`);
    return where;
  }

  async sincronizarProcesos(filtro: FiltroTerritorio) {
    const rows = await this.procesosClient.fetchRows({
      where: this.construirWhere(filtro, 'departamento_entidad', 'ciudad_entidad', 'fecha_de_publicacion_del'),
      // NO mandamos `tema` como $q acá a propósito: Socrata `$q` con 2+
      // palabras exige casi frase exacta (probado a mano: "mantenimiento
      // colegios" da 0 resultados aunque "mantenimiento" solo da 172) — muy
      // estricto para lenguaje libre de un ciudadano. El filtro real por
      // tema lo hace `CivicIntelService` contra `textoNormalizado` en Mongo,
      // que sí matchea por OR de palabras.
      limit: filtro.limit ?? 500,
      order: 'fecha_de_publicacion_del DESC',
    });

    let escritos = 0;
    for (const row of rows) {
      if (!row.id_del_proceso) continue;
      const nombreProcedimiento = row.nombre_del_procedimiento || '';
      const descripcionProcedimiento = row.descripci_n_del_procedimiento || '';
      await this.procesoModel.findOneAndUpdate(
        { idProceso: row.id_del_proceso },
        {
          idProceso: row.id_del_proceso,
          referenciaProceso: row.referencia_del_proceso || '',
          entidad: row.entidad || '',
          nitEntidad: row.nit_entidad || '',
          departamentoEntidad: row.departamento_entidad || '',
          ciudadEntidad: row.ciudad_entidad || '',
          departamentoEntidadNormalizado: normalizar(row.departamento_entidad || ''),
          ciudadEntidadNormalizado: normalizar(row.ciudad_entidad || ''),
          nombreProcedimiento,
          descripcionProcedimiento,
          textoNormalizado: normalizar(`${nombreProcedimiento} ${descripcionProcedimiento}`),
          modalidadContratacion: row.modalidad_de_contratacion || '',
          codigoCategoriaUnspsc: row.codigo_principal_de_categoria || '',
          precioBase: toNumber(row.precio_base),
          fechaPublicacion: toDate(row.fecha_de_publicacion_del || row.fecha_de_publicacion),
          estadoProcedimiento: row.estado_del_procedimiento || '',
          estadoApertura: row.estado_de_apertura_del_proceso || '',
          fase: row.fase || '',
          adjudicado: String(row.adjudicado).toLowerCase() === 'si' || String(row.adjudicado).toLowerCase() === 'true',
          valorTotalAdjudicacion: toNumber(row.valor_total_adjudicacion),
          fechaAdjudicacion: toDate(row.fecha_adjudicacion),
          nombreProveedorAdjudicado: row.nombre_del_proveedor || '',
          nitProveedorAdjudicado: row.nit_del_proveedor_adjudicado || '',
          crudo: row,
        },
        { upsert: true, new: true },
      );
      escritos++;
    }
    this.logger.log(`Sincronizados ${escritos} procesos (de ${rows.length} recibidos de Socrata).`);
    return escritos;
  }

  async sincronizarContratos(filtro: FiltroTerritorio) {
    const rows = await this.contratosClient.fetchRows({
      where: this.construirWhere(filtro, 'departamento', 'ciudad', 'fecha_de_firma'),
      limit: filtro.limit ?? 500,
      order: 'fecha_de_firma DESC',
    });

    let escritos = 0;
    for (const row of rows) {
      if (!row.id_contrato) continue;
      const objetoDelContrato = row.objeto_del_contrato || '';
      const descripcionDelProceso = row.descripcion_del_proceso || '';
      await this.contratoModel.findOneAndUpdate(
        { idContrato: row.id_contrato },
        {
          idContrato: row.id_contrato,
          referenciaContrato: row.referencia_del_contrato || '',
          procesoDeCompra: row.proceso_de_compra || '',
          // Socrata devuelve este campo como objeto { url: "..." }, no como string plano.
          urlProceso: (typeof row.urlproceso === 'object' ? row.urlproceso?.url : row.urlproceso) || '',
          nombreEntidad: row.nombre_entidad || '',
          nitEntidad: row.nit_entidad || '',
          departamento: row.departamento || '',
          ciudad: row.ciudad || '',
          departamentoNormalizado: normalizar(row.departamento || ''),
          ciudadNormalizado: normalizar(row.ciudad || ''),
          estadoContrato: row.estado_contrato || '',
          tipoDeContrato: row.tipo_de_contrato || '',
          fechaDeFirma: toDate(row.fecha_de_firma),
          fechaDeInicio: toDate(row.fecha_de_inicio_del_contrato),
          fechaDeFin: toDate(row.fecha_de_fin_del_contrato),
          objetoDelContrato,
          descripcionDelProceso,
          textoNormalizado: normalizar(`${objetoDelContrato} ${descripcionDelProceso}`),
          codigoCategoriaUnspsc: row.codigo_de_categoria_principal || '',
          proveedorAdjudicado: row.proveedor_adjudicado || '',
          nitProveedor: row.documento_proveedor || '',
          valorDelContrato: toNumber(row.valor_del_contrato),
          valorPagado: toNumber(row.valor_pagado),
          crudo: row,
        },
        { upsert: true, new: true },
      );
      escritos++;
    }
    this.logger.log(`Sincronizados ${escritos} contratos (de ${rows.length} recibidos de Socrata).`);
    return escritos;
  }

  async sincronizarTodo(filtro: FiltroTerritorio) {
    const [procesos, contratos] = await Promise.all([
      this.sincronizarProcesos(filtro),
      this.sincronizarContratos(filtro),
    ]);
    return { procesos, contratos };
  }
}
