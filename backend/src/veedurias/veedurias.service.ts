import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocalStorageService } from '../storage/local-storage.service';
import { extraerTextoPdf } from '../lib/pdf';
import { chunkTexto } from '../lib/chunk';
import { completar } from '../lib/llm';
import { normalizar } from '../common/normalizar';
import { Veeduria, Comentario, Hallazgo } from './veeduria.schema';
import { Proceso } from '../ingestion/proceso.schema';
import { Contrato } from '../ingestion/contrato.schema';

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
    @Inject(LocalStorageService) private readonly storage: LocalStorageService,
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
   * pasar el captcha) — nunca se automatiza esa parte, ver README. Todo
   * esto corre en este mismo proceso, sin servicios externos: se guarda en
   * disco local (`LocalStorageService`) y, si es un PDF de texto, se
   * extrae y trocea (`pdf-parse` + `chunkTexto`) para poder buscarlo
   * después por palabras clave — ver `preguntarSobreDocumentos`.
   */
  async subirDocumento(id: string, archivo: { buffer: Buffer; filename: string; mimeType?: string }, subidoPor: string) {
    const v = await this.obtener(id);

    const subido = await this.storage.guardar(archivo.buffer, archivo.filename);

    let indexado = false;
    let motivoNoIndexado: string | undefined;
    try {
      const { paginas } = await extraerTextoPdf(archivo.buffer);
      if (paginas.length === 0) {
        motivoNoIndexado = 'El PDF no tiene texto extraíble (probablemente escaneado) — no hay OCR todavía.';
      } else {
        const chunksNuevos = paginas.flatMap((p) =>
          chunkTexto(p.text).map((texto) => ({ archivo: archivo.filename, texto, textoNormalizado: normalizar(texto) })),
        );
        v.chunksTexto.push(...chunksNuevos);
        indexado = true;
      }
    } catch (err) {
      motivoNoIndexado = `No se pudo leer el PDF: ${(err as Error).message}`;
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

  /**
   * Pregunta en lenguaje natural sobre los documentos ya subidos de esta
   * veeduría. Búsqueda local por palabras clave (sin base vectorial: mismo
   * criterio que `oportunidades.service.ts` para el matching de empresas) —
   * se traen los chunks con más palabras de la pregunta en común. Si hay
   * `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` configurada, se le pide a un LLM
   * que redacte la respuesta basada SOLO en esos chunks; si no, se
   * devuelven los fragmentos más relevantes tal cual — funciona igual, con
   * menos redacción.
   */
  async preguntarSobreDocumentos(id: string, pregunta: string) {
    const v = await this.obtener(id);
    if (v.chunksTexto.length === 0) {
      return { answer: 'Todavía no hay documentos con texto legible en esta veeduría — subí un PDF de texto primero.', citations: [] };
    }

    const palabras = normalizar(pregunta).split(' ').filter((p) => p.length > 2);
    const relevantes = v.chunksTexto
      .map((c) => ({ chunk: c, score: palabras.filter((p) => c.textoNormalizado.includes(p)).length }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (relevantes.length === 0) {
      return { answer: 'No encontré nada en los documentos subidos que se relacione con esa pregunta.', citations: [] };
    }

    const citations = relevantes.map((r, i) => ({ id: i + 1, file: r.chunk.archivo, score: r.score }));

    const respuestaIa = await completar({
      system:
        'Sos el asistente de una veeduría ciudadana. Respondés en español, en 3-5 frases, basándote ÚNICAMENTE en los fragmentos de documento que te dan. Si no alcanza para responder, decilo explícitamente en vez de inventar.',
      prompt: `Pregunta: "${pregunta}"\n\nFragmentos de documentos:\n${relevantes.map((r, i) => `[${i + 1}] (${r.chunk.archivo}) ${r.chunk.texto}`).join('\n\n')}`,
    }).catch((err) => {
      this.logger.warn(`No se pudo redactar con IA: ${(err as Error).message}`);
      return null;
    });

    const answer =
      respuestaIa ??
      `No configuraste una API key de IA (ANTHROPIC_API_KEY/OPENAI_API_KEY), así que te muestro los fragmentos más relevantes tal cual:\n\n` +
        relevantes.map((r, i) => `[${i + 1}] (${r.chunk.archivo}): "${r.chunk.texto.slice(0, 300)}${r.chunk.texto.length > 300 ? '…' : ''}"`).join('\n\n');

    return { answer, citations };
  }
}
