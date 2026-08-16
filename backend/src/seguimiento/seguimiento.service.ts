import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';

export interface ResumenSeguimiento {
  totalContratos: number;
  valorTotal: number;
  proveedoresUnicos: number;
  enEjecucion: number;
  liquidados: number;
  conProrroga: number;
  conSobrecosto: number;
  sobrecostoTotal: number;
}

export interface ContratoSeguimiento {
  id: string;
  objeto: string;
  entidad: string;
  ciudad: string;
  departamento: string;
  estado: string;
  tipo: string;
  fechaFirma: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  valorDelContrato: number;
  valorPagado: number;
  sobrecosto: boolean;
  montoSobrecosto: number;
  veedor: string;
  responsable: string;
  prorrogas: number;
  puedeSerProrrogado: boolean;
  liquidado: boolean;
  origenDeLosRecursos: string;
  urlProceso: string;
}

export interface PerfilContratista {
  nit: string;
  nombre: string;
  resumen: {
    totalContratos: number;
    valorTotal: number;
    sobrecostoTotal: number;
    entidades: number;
    municipios: number;
  };
  contratos: ContratoSeguimiento[];
}

export interface RankingContratista {
  nit: string;
  nombre: string;
  contratos: number;
  valorTotal: number;
  entidades: number;
  municipios: number;
}

@Injectable()
export class SeguimientoService {
  constructor(
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
  ) {}

  async resumen(): Promise<ResumenSeguimiento> {
    const enEjecucion = { estadoContrato: /ejecuci/i };
    const conProrroga = { diasAdicionados: { $gt: 0 } };
    const conSobrecosto = { $expr: { $gt: ['$valorPagado', '$valorDelContrato'] } };

    const [fila] = await this.contratoModel.aggregate([
      {
        $facet: {
          total: [{ $count: 'v' }],
          valor: [{ $group: { _id: null, v: { $sum: '$valorDelContrato' } } }],
          proveedores: [
            { $match: { nitProveedor: { $ne: '' } } },
            { $group: { _id: '$nitProveedor' } },
            { $count: 'v' },
          ],
          ejecucion: [{ $match: enEjecucion }, { $count: 'v' }],
          liquidados: [{ $match: { liquidado: true } }, { $count: 'v' }],
          prorrogas: [{ $match: conProrroga }, { $count: 'v' }],
          sobrecosto: [{ $match: conSobrecosto }, { $count: 'v' }],
          sobrecostoTotal: [
            {
              $group: {
                _id: null,
                v: {
                  $sum: {
                    $max: [
                      { $subtract: ['$valorPagado', '$valorDelContrato'] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const num = (arr: { v?: number }[] | undefined): number => arr?.[0]?.v ?? 0;

    return {
      totalContratos: num(fila?.total),
      valorTotal: num(fila?.valor),
      proveedoresUnicos: num(fila?.proveedores),
      enEjecucion: num(fila?.ejecucion),
      liquidados: num(fila?.liquidados),
      conProrroga: num(fila?.prorrogas),
      conSobrecosto: num(fila?.sobrecosto),
      sobrecostoTotal: num(fila?.sobrecostoTotal),
    };
  }

  async contratista(nit: string): Promise<PerfilContratista | null> {
    const docs = await this.contratoModel
      .find({ nitProveedor: nit })
      .sort({ fechaDeFirma: -1 })
      .limit(500);

    if (docs.length === 0) return null;

    const contratos: ContratoSeguimiento[] = docs.map((c) => {
      const sobrecosto = c.valorPagado > c.valorDelContrato;
      return {
        id: c.idContrato,
        objeto: c.objetoDelContrato || c.descripcionDelProceso,
        entidad: c.nombreEntidad,
        ciudad: c.ciudad,
        departamento: c.departamento,
        estado: c.estadoContrato,
        tipo: c.tipoDeContrato,
        fechaFirma: c.fechaDeFirma?.toISOString() ?? null,
        fechaInicio: c.fechaDeInicio?.toISOString() ?? null,
        fechaFin: c.fechaDeFin?.toISOString() ?? null,
        valorDelContrato: c.valorDelContrato,
        valorPagado: c.valorPagado,
        sobrecosto,
        montoSobrecosto: sobrecosto ? c.valorPagado - c.valorDelContrato : 0,
        veedor: c.nombreSupervisor,
        responsable: c.nombreOrdenadorDelGasto,
        prorrogas: c.diasAdicionados,
        puedeSerProrrogado: c.puedeSerProrrogado,
        liquidado: c.liquidado,
        origenDeLosRecursos: c.origenDeLosRecursos,
        urlProceso: c.urlProceso,
      };
    });

    const [resumen] = await this.contratoModel.aggregate([
      { $match: { nitProveedor: nit } },
      {
        $group: {
          _id: null,
          totalContratos: { $sum: 1 },
          valorTotal: { $sum: '$valorDelContrato' },
          sobrecostoTotal: {
            $sum: {
              $max: [
                { $subtract: ['$valorPagado', '$valorDelContrato'] },
                0,
              ],
            },
          },
          entidades: { $addToSet: '$nombreEntidad' },
          municipios: { $addToSet: '$ciudad' },
        },
      },
    ]);

    return {
      nit,
      nombre: docs[0].proveedorAdjudicado,
      resumen: {
        totalContratos: resumen?.totalContratos ?? docs.length,
        valorTotal: resumen?.valorTotal ?? 0,
        sobrecostoTotal: resumen?.sobrecostoTotal ?? 0,
        entidades: resumen?.entidades?.length ?? 0,
        municipios: resumen?.municipios?.length ?? 0,
      },
      contratos,
    };
  }

  async ranking(limit = 20): Promise<RankingContratista[]> {
    const filas = await this.contratoModel.aggregate([
      { $match: { nitProveedor: { $ne: '' } } },
      {
        $group: {
          _id: '$nitProveedor',
          nombre: { $last: '$proveedorAdjudicado' },
          contratos: { $sum: 1 },
          valorTotal: { $sum: '$valorDelContrato' },
          entidades: { $addToSet: '$nombreEntidad' },
          municipios: { $addToSet: '$ciudad' },
        },
      },
      { $match: { contratos: { $gt: 1 } } },
      { $sort: { contratos: -1, valorTotal: -1 } },
      { $limit: Math.max(1, Math.min(limit, 100)) },
    ]);

    return filas.map((f) => ({
      nit: f._id,
      nombre: f.nombre ?? '',
      contratos: f.contratos,
      valorTotal: f.valorTotal,
      entidades: f.entidades?.length ?? 0,
      municipios: f.municipios?.length ?? 0,
    }));
  }
}