import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proceso } from '../ingestion/proceso.schema';
import { Contrato } from '../ingestion/contrato.schema';
import { CeoIntelligenceClient } from '@ceo-core/intelligence-client';
import { CEO_INTELLIGENCE_CLIENT } from '../intelligence/ceo-intelligence-client.provider';
import { normalizar } from '../common/normalizar';

export interface ConsultaInput {
  departamento?: string;
  ciudad?: string;
  /** Tema en lenguaje libre, ej: "mantenimiento de colegios" — se usa para filtrar por texto. */
  tema: string;
  /** La pregunta completa del ciudadano, se le pasa tal cual al LLM para redactar la respuesta. */
  pregunta: string;
  /** 'YYYY-MM-DD' — filtra sobre lo ya sincronizado en Mongo (independiente del rango usado al sincronizar). */
  fechaDesde?: string;
  fechaHasta?: string;
}

interface Hallazgo {
  tipo: 'CONCENTRACION' | 'CONTRATOS_SIMILARES';
  severidad: 'ALTA' | 'MEDIA';
  titulo: string;
  detalle: string;
  evidencia: { entidad: string; id: string; link?: string }[];
}

@Injectable()
export class CivicIntelService {
  private readonly logger = new Logger(CivicIntelService.name);

  constructor(
    @InjectModel(Proceso.name) private readonly procesoModel: Model<Proceso>,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
    @Inject(CEO_INTELLIGENCE_CLIENT) private readonly intelligence: CeoIntelligenceClient,
  ) {}

  /** Compara siempre contra los campos *Normalizado guardados en la ingesta — ignora tildes/mayúsculas/puntuación. */
  private filtroTerritorio(departamento?: string, ciudad?: string, campoDepto = 'departamentoEntidadNormalizado', campoCiudad = 'ciudadEntidadNormalizado') {
    const filtro: Record<string, unknown> = {};
    if (departamento) filtro[campoDepto] = normalizar(departamento);
    if (ciudad) filtro[campoCiudad] = normalizar(ciudad);
    return filtro;
  }

  /** Concentración de proveedores: top proveedores por valor, y qué % del total representan los 2 mayores. */
  private detectarConcentracion(contratos: Contrato[]): Hallazgo | null {
    const porProveedor = new Map<string, { nombre: string; valor: number; contratos: string[] }>();
    let total = 0;
    for (const c of contratos) {
      const valor = c.valorDelContrato || 0;
      total += valor;
      const key = c.nitProveedor || c.proveedorAdjudicado;
      if (!key) continue;
      if (!porProveedor.has(key)) porProveedor.set(key, { nombre: c.proveedorAdjudicado, valor: 0, contratos: [] });
      const entry = porProveedor.get(key)!;
      entry.valor += valor;
      entry.contratos.push(c.idContrato);
    }
    if (total === 0 || porProveedor.size === 0) return null;

    const top = [...porProveedor.values()].sort((a, b) => b.valor - a.valor).slice(0, 2);
    const porcentaje = (top.reduce((s, p) => s + p.valor, 0) / total) * 100;
    if (porcentaje < 50) return null;

    return {
      tipo: 'CONCENTRACION',
      severidad: porcentaje >= 70 ? 'ALTA' : 'MEDIA',
      titulo: 'Concentración de proveedores',
      detalle: `${top.length} proveedor(es) (${top.map((p) => p.nombre).join(', ')}) representan el ${porcentaje.toFixed(0)}% del valor contratado en este tema/territorio.`,
      evidencia: top.flatMap((p) => p.contratos.slice(0, 5).map((id) => ({ entidad: p.nombre, id }))),
    };
  }

  /** Contratos cuyo objeto contractual normalizado es idéntico o casi idéntico entre sí (posible fraccionamiento). */
  private detectarContratosSimilares(contratos: Contrato[]): Hallazgo | null {
    const grupos = new Map<string, Contrato[]>();
    for (const c of contratos) {
      const texto = normalizar(c.objetoDelContrato || c.descripcionDelProceso || '');
      if (texto.length < 15) continue;
      const clave = texto.split(' ').slice(0, 8).join(' '); // primeras 8 palabras normalizadas como huella
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave)!.push(c);
    }
    const grupoMasGrande = [...grupos.values()].filter((g) => g.length >= 2).sort((a, b) => b.length - a.length)[0];
    if (!grupoMasGrande) return null;

    return {
      tipo: 'CONTRATOS_SIMILARES',
      severidad: grupoMasGrande.length >= 5 ? 'ALTA' : 'MEDIA',
      titulo: 'Contratos con objeto similar',
      detalle: `Se encontraron ${grupoMasGrande.length} contratos con objetos contractuales altamente similares — puede indicar fraccionamiento o un mismo servicio contratado repetidas veces.`,
      evidencia: grupoMasGrande.slice(0, 8).map((c) => ({ entidad: c.nombreEntidad, id: c.idContrato, link: c.urlProceso || undefined })),
    };
  }

  async consultar(input: ConsultaInput) {
    // Palabras normalizadas (sin tildes/mayúsculas) del tema, para matchear contra `textoNormalizado`
    // sin que importe cómo cada entidad escribió el objeto contractual en SECOP.
    const palabrasTema = normalizar(input.tema).split(' ').filter((p) => p.length > 2);
    const temaRegex = palabrasTema.length ? new RegExp(palabrasTema.join('|'), 'i') : null;

    const filtroProcesos: Record<string, unknown> = this.filtroTerritorio(input.departamento, input.ciudad);
    const filtroContratos: Record<string, unknown> = this.filtroTerritorio(
      input.departamento,
      input.ciudad,
      'departamentoNormalizado',
      'ciudadNormalizado',
    );
    if (temaRegex) {
      filtroProcesos.textoNormalizado = temaRegex;
      filtroContratos.textoNormalizado = temaRegex;
    }

    if (input.fechaDesde || input.fechaHasta) {
      const rango: Record<string, Date> = {};
      if (input.fechaDesde) rango.$gte = new Date(`${input.fechaDesde}T00:00:00`);
      if (input.fechaHasta) rango.$lte = new Date(`${input.fechaHasta}T23:59:59`);
      filtroProcesos.fechaPublicacion = rango;
      filtroContratos.fechaDeFirma = rango;
    }

    const [procesos, contratos] = await Promise.all([
      this.procesoModel.find(filtroProcesos).sort({ fechaPublicacion: -1 }).limit(500).lean<Proceso[]>(),
      this.contratoModel.find(filtroContratos).sort({ fechaDeFirma: -1 }).limit(500).lean<Contrato[]>(),
    ]);

    const valorTotal = contratos.reduce((s, c) => s + (c.valorDelContrato || 0), 0);
    const proveedoresUnicos = new Set(contratos.map((c) => c.nitProveedor || c.proveedorAdjudicado).filter(Boolean));

    const hallazgos = [this.detectarConcentracion(contratos as Contrato[]), this.detectarContratosSimilares(contratos as Contrato[])].filter(
      (h): h is Hallazgo => h !== null,
    );

    const resumen = {
      territorio: [input.ciudad, input.departamento].filter(Boolean).join(', ') || 'Colombia',
      tema: input.tema,
      valorTotalContratado: valorTotal,
      totalProcesos: procesos.length,
      totalContratos: contratos.length,
      proveedoresUnicos: proveedoresUnicos.size,
    };

    const respuesta = await this.redactarRespuesta(input, resumen, hallazgos);

    return {
      resumen,
      hallazgos,
      respuesta,
      evidenciaProcesos: procesos.slice(0, 20),
      evidenciaContratos: contratos.slice(0, 20),
    };
  }

  /** Si ceo-intelligence-service está disponible (URL+key configuradas), redacta con IA; si no, usa una plantilla simple. */
  private async redactarRespuesta(input: ConsultaInput, resumen: Record<string, unknown>, hallazgos: Hallazgo[]): Promise<string> {
    const plantilla = () =>
      `En ${resumen.territorio}, sobre "${input.tema}", encontramos ${resumen.totalContratos} contratos por un total de $${Number(resumen.valorTotalContratado).toLocaleString('es-CO')} con ${resumen.proveedoresUnicos} proveedores distintos.` +
      (hallazgos.length ? ` Encontramos ${hallazgos.length} aspecto(s) que pueden ser relevantes para una veeduría.` : ' No se detectaron patrones inusuales con los datos disponibles.');

    if (!process.env.INTELLIGENCE_SERVICE_KEY) return plantilla();

    try {
      const result = await this.intelligence.aiComplete({
        provider: 'anthropic',
        system:
          'Sos el asistente cívico de RADAR. Respondés en español, en 3-4 frases, tono claro para un ciudadano sin conocimientos técnicos de contratación pública. Basate SOLO en los datos que te dan, no inventes cifras.',
        prompt: `Pregunta del ciudadano: "${input.pregunta}"\n\nDatos agregados: ${JSON.stringify(resumen)}\n\nHallazgos detectados: ${JSON.stringify(hallazgos.map((h) => ({ titulo: h.titulo, detalle: h.detalle })))}`,
        maxTokens: 300,
      });
      return result.content;
    } catch (err) {
      this.logger.warn(`No se pudo redactar con IA (¿ceo-intelligence-service caído/no desplegado?): ${(err as Error).message}`);
      return plantilla();
    }
  }
}
