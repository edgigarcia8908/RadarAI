import { Injectable, Logger } from '@nestjs/common';
import { SocrataClient, soqlString, toNumber } from '../ingestion/socrata.client';
import { normalizar } from '../common/normalizar';

/**
 * Contexto territorial: dos fuentes DNP que no dependen de SECOP para
 * responder "¿tiene sentido lo que se está gastando en este municipio?".
 *
 * SGR (regalías, dataset `mzgh-shtp`): proyectos financiados con el
 * Sistema General de Regalías por municipio — trae algo que SECOP no
 * tiene: % de ejecución FÍSICA vs. FINANCIERA por proyecto. Si un
 * proyecto está pagado casi al 100% pero construido a mitad, es una señal
 * clásica de sobrecosto/obra inconclusa.
 *
 * MDM (Medición del Desempeño Municipal, dataset `nkjx-rsq7` — reemplazo
 * vigente de TerriData, que se investigó primero pero su dataset
 * `64cq-xb2k` ya no existe/da 404): índice 0-100 de qué tan bien le va a
 * la gestión del municipio, para dar contexto ("¿este municipio tiene
 * buena capacidad de gestión en general, o el score es bajo y esto es
 * consistente con otros problemas?").
 */
const DATASET_SGR_PROYECTOS = 'mzgh-shtp';
const DATASET_MDM = 'nkjx-rsq7';

export interface ProyectoRegalias {
  nombre: string;
  entidadEjecutora: string;
  valorTotal: number;
  estado: string;
  sector: string;
  ejecucionFinanciera: number | null;
  ejecucionFisica: number | null;
  brechaEjecucion: number | null;
}

export interface DesempenoMunicipal {
  anio: string | null;
  puntaje: number | null;
}

@Injectable()
export class TerritorioService {
  private readonly logger = new Logger(TerritorioService.name);
  private readonly clienteSgr = new SocrataClient(DATASET_SGR_PROYECTOS);
  private readonly clienteMdm = new SocrataClient(DATASET_MDM);

  async proyectosRegalias(ciudad: string): Promise<ProyectoRegalias[]> {
    if (!ciudad.trim()) return [];
    // El dataset de SGR guarda los nombres SIN tildes ("CHALAN", no
    // "Chalán") — comparar con upper() a secas nunca matchea un municipio
    // con tilde. Se quita con normalizar() antes de armar el LIKE.
    const ciudadSinTildes = normalizar(ciudad).toUpperCase();
    let filas: Record<string, any>[];
    try {
      filas = await this.clienteSgr.fetchRows({
        where: [`upper(entidadejecutora) like '%${soqlString(ciudadSinTildes)}%'`],
        limit: 50,
        order: 'valortotal DESC',
      });
    } catch (err) {
      this.logger.warn(`SGR no disponible para "${ciudad}": ${(err as Error).message}`);
      return [];
    }

    // El LIKE es amplio (nombre de municipio puede aparecer en el nombre de
    // otra entidad) — se filtra en memoria con el mismo normalizador que
    // usa el resto de la app, exigiendo que el municipio esté como palabra
    // completa en el nombre de la entidad ejecutora.
    const ciudadNorm = normalizar(ciudad);
    return filas
      .filter((f) => normalizar(f.entidadejecutora || '').split(' ').includes(ciudadNorm.split(' ').pop() || ciudadNorm))
      .map((f) => {
        const ejecucionFinanciera = f.ejecucionfinanciera != null ? toNumber(f.ejecucionfinanciera) : null;
        const ejecucionFisica = f.ejecucionfisica != null ? toNumber(f.ejecucionfisica) : null;
        return {
          nombre: f.nombre || '',
          entidadEjecutora: f.entidadejecutora || '',
          valorTotal: toNumber(f.valortotal),
          estado: f.estado || '',
          sector: f.sector || '',
          ejecucionFinanciera,
          ejecucionFisica,
          brechaEjecucion: ejecucionFinanciera != null && ejecucionFisica != null ? ejecucionFinanciera - ejecucionFisica : null,
        };
      });
  }

  async desempenoMunicipal(ciudad: string): Promise<DesempenoMunicipal> {
    if (!ciudad.trim()) return { anio: null, puntaje: null };
    let filas: Record<string, any>[];
    try {
      filas = await this.clienteMdm.fetchRows({
        where: [`upper(entidad) = upper('${soqlString(ciudad.trim())}')`, `indicador = 'MDM'`],
        order: 'anio DESC',
        limit: 1,
      });
    } catch (err) {
      this.logger.warn(`MDM no disponible para "${ciudad}": ${(err as Error).message}`);
      return { anio: null, puntaje: null };
    }
    const fila = filas[0];
    if (!fila) return { anio: null, puntaje: null };
    return { anio: fila.anio || null, puntaje: toNumber(fila.dato) };
  }

  async contexto(ciudad: string) {
    const [proyectos, mdm] = await Promise.all([this.proyectosRegalias(ciudad), this.desempenoMunicipal(ciudad)]);
    const proyectosConBrecha = proyectos.filter((p) => p.brechaEjecucion !== null && p.brechaEjecucion > 30);
    return {
      ciudad,
      desempenoMunicipal: mdm,
      proyectosRegalias: proyectos,
      alerta: proyectosConBrecha.length
        ? `${proyectosConBrecha.length} proyecto(s) financiado(s) con regalías tiene(n) una ejecución financiera muy por encima de la física (pagado mucho más de lo construido) — posible sobrecosto u obra inconclusa.`
        : null,
    };
  }
}
