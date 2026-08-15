import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CeoStorageClient } from '@ceo-core/storage-client';
import { CeoIntelligenceClient } from '@ceo-core/intelligence-client';
import { Veeduria, Comentario, Hallazgo } from './veeduria.schema';
import { Proceso } from '../ingestion/proceso.schema';
import { Contrato } from '../ingestion/contrato.schema';
import { CEO_STORAGE_CLIENT } from '../storage/ceo-storage-client.provider';
import { CEO_INTELLIGENCE_CLIENT } from '../intelligence/ceo-intelligence-client.provider';

export interface CrearVeeduriaInput {
  titulo: string;
  descripcion?: string;
  departamento?: string;
  ciudad?: string;
  tema?: string;
  procesosVinculados?: string[];
  contratosVinculados?: string[];
}

@Injectable()
export class VeeduriasService {
  private readonly logger = new Logger(VeeduriasService.name);

  constructor(
    @InjectModel(Veeduria.name) private readonly model: Model<Veeduria>,
    @InjectModel(Proceso.name) private readonly procesoModel: Model<Proceso>,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
    @Inject(CEO_STORAGE_CLIENT) private readonly storage: CeoStorageClient,
    @Inject(CEO_INTELLIGENCE_CLIENT) private readonly intelligence: CeoIntelligenceClient,
  ) {}

  crear(data: CrearVeeduriaInput) {
    return this.model.create(data);
  }

  listar(filtro: { departamento?: string; ciudad?: string } = {}) {
    const query: Record<string, unknown> = {};
    if (filtro.departamento) query.departamento = filtro.departamento;
    if (filtro.ciudad) query.ciudad = filtro.ciudad;
    return this.model.find(query).sort({ createdAt: -1 });
  }

  async obtener(id: string) {
    const v = await this.model.findById(id);
    if (!v) throw new NotFoundException('Veeduría no encontrada');
    return v;
  }

  async agregarHallazgo(id: string, hallazgo: Omit<Hallazgo, 'fecha'>) {
    const v = await this.obtener(id);
    v.hallazgos.push({ ...hallazgo, fecha: new Date() });
    return v.save();
  }

  async agregarComentario(id: string, comentario: Omit<Comentario, 'fecha'>) {
    const v = await this.obtener(id);
    v.comentarios.push({ ...comentario, fecha: new Date() });
    return v.save();
  }

  async marcarChecklist(id: string, indice: number, hecho: boolean) {
    const v = await this.obtener(id);
    if (!v.checklist[indice]) throw new NotFoundException('Item de checklist no encontrado');
    v.checklist[indice].hecho = hecho;
    v.markModified('checklist');
    return v.save();
  }

  async vincularEvidencia(id: string, data: { procesoId?: string; contratoId?: string }) {
    const v = await this.obtener(id);
    if (data.procesoId && !v.procesosVinculados.includes(data.procesoId)) v.procesosVinculados.push(data.procesoId);
    if (data.contratoId && !v.contratosVinculados.includes(data.contratoId)) v.contratosVinculados.push(data.contratoId);
    return v.save();
  }

  /**
   * Trae los procesos/contratos completos (no solo los ids) vinculados a
   * esta veeduría — es la "tabla con toda la data" que se muestra antes del
   * link de "revisar en SECOP", para que el colaborador sepa exactamente
   * qué proceso está a punto de ir a buscar manualmente.
   */
  async obtenerEvidenciaDetalle(id: string) {
    const v = await this.obtener(id);
    const [procesos, contratos] = await Promise.all([
      v.procesosVinculados.length ? this.procesoModel.find({ idProceso: { $in: v.procesosVinculados } }).lean() : [],
      v.contratosVinculados.length ? this.contratoModel.find({ idContrato: { $in: v.contratosVinculados } }).lean() : [],
    ]);
    return { procesos, contratos };
  }

  async agregarColaborador(id: string, colaborador: string) {
    const v = await this.obtener(id);
    if (!v.colaboradores.includes(colaborador)) v.colaboradores.push(colaborador);
    return v.save();
  }

  /**
   * Sube un documento que un colaborador consiguió MANUALMENTE (ej. por
   * derecho de petición, o descargándolo él mismo de SECOP después de
   * pasar el captcha) — nunca se automatiza esa parte, ver README. Este
   * método solo hace lo que sí es automatizable una vez el humano ya tiene
   * el archivo: subirlo a `ceo-storage-service` y, si es un PDF de texto,
   * parsearlo e indexarlo en `ceo-intelligence-service` para que el
   * asistente de la veeduría pueda responder preguntas sobre su contenido.
   */
  async subirDocumento(id: string, archivo: { buffer: Buffer; filename: string; mimeType?: string }, subidoPor: string) {
    const v = await this.obtener(id);

    const subido = await this.storage.upload({
      buffer: archivo.buffer,
      filename: archivo.filename,
      mimeType: archivo.mimeType,
      ownerId: id,
    });

    let indexado = false;
    let motivoNoIndexado: string | undefined;
    try {
      const parseado = await this.intelligence.parseDocument({ fileBuffer: archivo.buffer, fileName: archivo.filename });
      const paginasConTexto = parseado.pages.filter((p) => p.text?.trim());
      if (paginasConTexto.length === 0) {
        motivoNoIndexado = 'El PDF no tiene texto extraíble (probablemente escaneado) — ceo-intelligence-service no hace OCR todavía.';
      } else {
        await this.intelligence.ragIngest({
          collection: `veeduria_${id}`,
          sourceId: archivo.filename,
          chunks: paginasConTexto.map((p) => ({ text: p.text, metadata: { page: p.pageNumber, archivo: archivo.filename } })),
          embeddingProvider: 'openai',
        });
        indexado = true;
      }
    } catch (err) {
      motivoNoIndexado = `No se pudo indexar (¿ceo-intelligence-service no está corriendo?): ${(err as Error).message}`;
      this.logger.warn(motivoNoIndexado);
    }

    v.documentos.push({
      storageId: subido.id,
      nombre: archivo.filename,
      url: subido.url,
      subidoPor,
      fecha: new Date(),
      indexado,
      motivoNoIndexado,
    });
    return v.save();
  }

  /** Pregunta en lenguaje natural sobre los documentos ya indexados de esta veeduría (RAG real, con citas). */
  async preguntarSobreDocumentos(id: string, pregunta: string) {
    const v = await this.obtener(id);
    if (!v.documentos.some((d) => d.indexado)) {
      return { answer: 'Todavía no hay documentos indexados en esta veeduría — subí un PDF de texto primero.', citations: [], matches: [] };
    }
    return this.intelligence.ragQuery({ collection: `veeduria_${id}`, query: pregunta, topK: 5 });
  }
}
