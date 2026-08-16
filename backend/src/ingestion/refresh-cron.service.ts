import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Interval } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { Contrato } from './contrato.schema';
import { IngestionService } from './ingestion.service';

const CUARENTA_Y_OCHO_HORAS_MS = 48 * 60 * 60 * 1000;
const TAMANO_LOTE = 3;
const PAUSA_ENTRE_LOTES_MS = 2000;

interface TerritorioSincronizado {
  departamento: string;
  ciudad: string;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Antes cada usuario disparaba la sincronización a mano (botón "Buscar"),
 * así que el primer usuario del día siempre pagaba el costo completo de ir
 * a buscar a Socrata (10-40s de espera, visto real en sesión: Cundinamarca
 * completo tardó ~30-40s). Este job refresca en segundo plano, cada 48h,
 * TODOS los territorios que ya alguien sincronizó antes — así la mayoría de
 * las consultas encuentran datos ya frescos en Mongo y responden casi
 * instantáneo, sin que el usuario tenga que esperar el viaje a SECOP.
 *
 * "Territorio ya sincronizado" = cualquier departamento/ciudad que YA
 * aparece en `Contrato` — no hace falta una lista separada de "territorios
 * vigilados", el propio uso de la app ya la define. Por lotes (de a
 * `TAMANO_LOTE`, con pausa entre lotes) para no saturar la API pública de
 * Socrata ni disparar todos los territorios en paralelo — mismo espíritu
 * que el backoff que ya tiene `SocrataClient`.
 *
 * Limitación conocida (Fase 1, igual que el resto de la ingesta): esto
 * corre en memoria del proceso — si el backend se reinicia, el intervalo
 * arranca de cero (no hay persistencia de "cuándo corrió por última vez").
 * Para un solo proceso de larga duración (como corre hoy) alcanza; con
 * múltiples instancias haría falta un lock distribuido (BullMQ, ver README).
 */
@Injectable()
export class RefreshCronService {
  private readonly logger = new Logger(RefreshCronService.name);
  private corriendo = false;

  constructor(
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
    private readonly ingestion: IngestionService,
  ) {}

  @Interval(CUARENTA_Y_OCHO_HORAS_MS)
  async refrescarTodo(): Promise<void> {
    if (this.corriendo) {
      this.logger.warn('Refresco periódico saltado — la corrida anterior todavía no termina.');
      return;
    }
    this.corriendo = true;
    const inicio = Date.now();
    try {
      const territorios = await this.territoriosASincronizar();
      this.logger.log(`Refresco periódico (cada 48h): ${territorios.length} territorio(s) ya sincronizados antes, en lotes de ${TAMANO_LOTE}.`);

      let contratosEscritos = 0;
      let procesosEscritos = 0;
      for (let i = 0; i < territorios.length; i += TAMANO_LOTE) {
        const lote = territorios.slice(i, i + TAMANO_LOTE);
        const resultados = await Promise.all(
          lote.map((t) =>
            this.ingestion.sincronizarTodo({ departamento: t.departamento, ciudad: t.ciudad }).catch((err) => {
              this.logger.warn(`Refresco falló para ${t.ciudad}, ${t.departamento}: ${(err as Error).message}`);
              return null;
            }),
          ),
        );
        for (const r of resultados) {
          if (!r) continue;
          contratosEscritos += r.contratos;
          procesosEscritos += r.procesos;
        }
        if (i + TAMANO_LOTE < territorios.length) await esperar(PAUSA_ENTRE_LOTES_MS);
      }

      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
      this.logger.log(`Refresco periódico terminado en ${segundos}s: ${contratosEscritos} contratos y ${procesosEscritos} procesos actualizados en ${territorios.length} territorio(s).`);
    } finally {
      this.corriendo = false;
    }
  }

  /** Departamento+ciudad distintos ya presentes en Contrato — la definición de "territorio vigilado" (ver comentario de la clase). */
  private async territoriosASincronizar(): Promise<TerritorioSincronizado[]> {
    const filas = await this.contratoModel.aggregate<{ _id: { departamento: string; ciudad: string } }>([
      { $match: { departamento: { $ne: '' }, ciudad: { $ne: '' } } },
      { $group: { _id: { departamento: '$departamento', ciudad: '$ciudad' } } },
    ]);
    return filas.map((f) => ({ departamento: f._id.departamento, ciudad: f._id.ciudad }));
  }
}
