import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';
import { IngestionService } from '../ingestion/ingestion.service';
import { CuipoService } from '../cuipo/cuipo.service';
import { completar } from '../lib/llm';
import { normalizar } from '../common/normalizar';
import { departamentoRealSecop } from '../common/departamento-secop';
import { palabrasConSinonimos } from '../common/sinonimos';
import {
  Presentation,
  generarPresentacion,
  fallbackResumen,
  fallbackPersona,
  fallbackTema,
  fallbackBusquedaEnVivo,
  fallbackSinDatos,
  fallbackSaludo,
} from './build-presentation';

export interface ChatConsultaInput {
  mensaje: string;
  departamento?: string;
  ciudad?: string;
}

/**
 * Lista de municipios y ciudades principales de Colombia para detección básica en el mensaje del usuario.
 * Se usa normalizado (sin tildes, minúsculas) para matching.
 */
const MUNICIPIOS_COLOMBIA: string[] = [
  'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'cucuta', 'bucaramanga', 'pereira', 'santa marta', 'ibague',
  'pasto', 'manizales', 'neiva', 'villavicencio', 'armenia', 'popayan', 'valledupar', 'monteria', 'sincelejo', 'riohacha',
  'quibdo', 'mitu', 'puerto carreno', 'leticia', 'inirida', 'san jose del guaviare', 'florencia', 'yopal', 'tunja', 'sogamoso',
  'duitama', 'chia', 'zipaquira', 'facatativa', 'mosquera', 'funza', 'madrid', 'soacha', 'girardot', 'melgar', 'espinal',
  'guaduas', 'honda', 'la mesa', 'vianey', 'villapinzon', 'chiquinquira', 'moniquira', 'san gil', 'socorro', 'barbosa',
  'bucarasica', 'cucutilla', 'el carmen', 'el tablon', 'el zulia', 'gramalote', 'hacari', 'herran', 'labateca', 'los patios',
  'lourdes', 'mutiscua', 'ocaña', 'pamplona', 'pamplonita', 'puerto santander', 'ragral', 'salazar', 'san calixto', 'san cayetano',
  'santiago', 'sardinata', 'silos', 'teorama', 'tibú', 'toledo', 'villa del rosario', 'villa cario', 'aguachica', 'agustin codazzi',
  'astrea', 'becerril', 'bosconia', 'chimichagua', 'chiriguana', 'curumani', 'el paso', 'gamarra', 'gonzalez', 'la gloria',
  'la paz', 'manaure balcon del cesar', 'pailitas', 'pelaya', 'pueblo bello', 'rio de oro', 'la jagua de ibirico', 'san alberto',
  'san diego', 'san martin', 'tamalameque', 'valledupar'
];

function extraerCiudadDelMensaje(mensaje: string): string | null {
  const texto = normalizar(mensaje?.toLowerCase() || '');
  // Patrones comunes: "en X", "de X", "mi municipio es X", "municipio de X", "ciudad de X", "X me interesa"
  const patrones = [
    /\ben\s+([a-záéíóúñ\s]+)/gi,
    /\bde\s+([a-záéíóúñ\s]+)/gi,
    /mi\s+municipio\s+(?:es|es\s+de)\s+([a-záéíóúñ\s]+)/gi,
    /municipio\s+de\s+([a-záéíóúñ\s]+)/gi,
    /ciudad\s+de\s+([a-záéíóúñ\s]+)/gi,
    /lugar\s+(?:es|de)\s+([a-záéíóúñ\s]+)/gi,
  ];

  for (const patron of patrones) {
    const matches = [...texto.matchAll(patron)];
    for (const match of matches) {
      const candidato = match[1]?.trim();
      if (!candidato) continue;
      // Normalizar candidato y buscar en lista conocida
      const norm = normalizar(candidato);
      if (MUNICIPIOS_COLOMBIA.includes(norm)) {
        // Devolver el nombre original con capitalización básica
        return candidato.split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      }
    }
  }
  return null;
}

/**
 * Backend de "Anna María": reusa el Contrato ya sincronizado en Mongo
 * (mismo patrón que CivicIntelService) + CuipoService para presupuesto +
 * completar() para redactar en lenguaje natural. Sin ninguna API key de
 * LLM configurada, cae a una plantilla determinística con los mismos
 * números reales — nunca inventa cifras.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
    @Inject(CuipoService) private readonly cuipo: CuipoService,
    @Inject(IngestionService) private readonly ingestion: IngestionService,
  ) {}

  async consultar(input: ChatConsultaInput): Promise<{ respuesta: string; requiereTerritorio?: boolean; presentacion?: Presentation }> {
    // 1. Usar ciudad del contexto de la app (radar state)
    let ciudad = input.ciudad?.trim();

    // 2. Si no hay ciudad en contexto, intentar extraerla del mensaje del usuario
    if (!ciudad) {
      ciudad = extraerCiudadDelMensaje(input.mensaje);
    }

    // 3. Si sigue sin ciudad, preguntar amablemente
    if (!ciudad) {
      const esSaludo = /^hola|^buenas|^qué tal|^buenos?\s*(días?|tardes?|noches?)|^hi\b|^hello\b/i.test(input.mensaje?.trim() || '');
      return {
        // requiereTerritorio=true le dice al frontend que la PRÓXIMA respuesta
        // del usuario probablemente sea el nombre del municipio, no una
        // pregunta nueva — así el chat puede combinarla con la pregunta
        // original en vez de tratarla como un mensaje aislado. Provisional
        // (no depende de LLM): funciona por matching de texto en el
        // frontend contra colombia.json.
        requiereTerritorio: true,
        presentacion: fallbackSaludo(esSaludo),
        respuesta: esSaludo
          ? `¡Hola! 👋 Soy Anna María, tu asistente cívica en RadarAI.

¿Me podrías indicar tu ubicación o el lugar sobre el cual quieres consultar, por favor?`
          : `¿Me podrías indicar tu ubicación o el lugar sobre el cual quieres consultar, por favor?`,
      };
    }

    const departamentoReal = departamentoRealSecop(input.departamento, ciudad);
    const filtro: Record<string, unknown> = { ciudadNormalizado: normalizar(ciudad) };
    if (departamentoReal) filtro.departamentoNormalizado = normalizar(departamentoReal);

    const contratos = await this.contratoModel.find(filtro).lean<Contrato[]>();

    if (contratos.length === 0) {
      return {
        presentacion: fallbackSinDatos(ciudad),
        respuesta: `Todavía no tengo datos sincronizados de ${ciudad}. Ve a "Entender gasto" o "Vigilar mi territorio", elige ${ciudad} y dale sincronizar/analizar — después vuelvo a preguntarte esto y te respondo con cifras reales.`,
      };
    }

    const valorTotal = contratos.reduce((s, c) => s + (c.valorDelContrato || 0), 0);
    const porProveedor = new Map<string, { nombre: string; valor: number; contratos: number }>();
    for (const c of contratos) {
      const key = c.nitProveedor || c.proveedorAdjudicado;
      if (!key) continue;
      if (!porProveedor.has(key)) porProveedor.set(key, { nombre: c.proveedorAdjudicado, valor: 0, contratos: 0 });
      const entry = porProveedor.get(key)!;
      entry.valor += c.valorDelContrato || 0;
      entry.contratos++;
    }
    const topProveedores = [...porProveedor.values()].sort((a, b) => b.valor - a.valor).slice(0, 5);

    let presupuestoResumen = '';
    try {
      const p = await this.cuipo.obtenerPresupuesto({ departamento: input.departamento, ciudad });
      if (!p.mensaje) {
        presupuestoResumen = `Presupuesto apropiado: $${p.presupuestoApropiado.toLocaleString('es-CO')}, comprometido: $${p.comprometido.toLocaleString('es-CO')} (${p.porcentajeComprometido?.toFixed(0)}%).`;
      }
    } catch {
      // CUIPO es un extra — si falla, el chat sigue con lo de SECOP.
    }

    const datosReales = {
      territorio: `${ciudad}${departamentoReal ? `, ${departamentoReal}` : ''}`,
      totalContratos: contratos.length,
      valorTotalContratado: valorTotal,
      proveedoresUnicos: porProveedor.size,
      topProveedores: topProveedores.map((p) => ({ nombre: p.nombre, valor: p.valor, contratos: p.contratos, porcentaje: valorTotal > 0 ? (p.valor / valorTotal) * 100 : 0 })),
      presupuesto: presupuestoResumen || null,
      // Muestra con nombres de firmantes — si preguntan por una persona
      // puntual ("¿cuántos contratos ha tenido Fulano?"), el LLM la busca
      // acá. Sin esto, cualquier pregunta sobre una persona quedaba sin
      // responder de verdad (mismo bug que tenía "Entender gasto").
      muestraContratos: contratos.slice(0, 40).map((c) => ({
        entidad: c.nombreEntidad,
        objeto: (c.objetoDelContrato || '').slice(0, 100),
        proveedor: c.proveedorAdjudicado,
        valor: c.valorDelContrato,
        representanteLegal: c.nombreRepresentanteLegal,
        ordenadorDelGasto: c.nombreOrdenadorDelGasto,
        supervisor: c.nombreSupervisor,
      })),
    };

    // Igual que en civic-intel.service.ts: si la pregunta menciona a una
    // persona real de la muestra, responde eso directamente — determinístico,
    // no depende de que haya API key de LLM configurada (no la hay por
    // defecto en este repo).
    const respuestaPorPersona = await this.buscarRespuestaPorPersona(input.mensaje, contratos);
    const respuestaPorTema = respuestaPorPersona ? null : await this.respuestaPorTema(input.mensaje, contratos, datosReales.territorio, contratos.length);
    if (respuestaPorPersona) {
      return { respuesta: respuestaPorPersona.texto, presentacion: respuestaPorPersona.presentacion };
    }
    if (respuestaPorTema) {
      return { respuesta: respuestaPorTema.texto, presentacion: respuestaPorTema.presentacion };
    }

    // Última capa antes de caer al resumen genérico: si la pregunta trae al
    // menos 2 palabras "de nombre propio" (4+ letras) que no aparecieron en
    // nada de lo ya sincronizado, puede ser alguien/algo real en SECOP que
    // simplemente está fuera de los ~500-750 contratos más recientes que
    // tenemos en Mongo (Tocancipá tiene 5254 contratos reales en SECOP,
    // solo 750 sincronizados). En vez de rendirse, se busca en vivo contra
    // Socrata antes de responder — así "busca a Fulano" hace lo que pide.
    const resultadoEnVivo = await this.respuestaPorBusquedaEnVivo(input.mensaje, input.departamento, ciudad);
    if (resultadoEnVivo) return { respuesta: resultadoEnVivo.texto, presentacion: resultadoEnVivo.presentacion };

    const resultado = await this.redactar(input.mensaje, datosReales);
    return { respuesta: resultado.respuesta, presentacion: resultado.presentacion };
  }

  private async respuestaPorBusquedaEnVivo(mensaje: string, departamento: string | undefined, ciudad: string): Promise<{ texto: string; presentacion: Presentation } | null> {
    // Ojo: NO alcanza con tomar las primeras palabras de 4+ letras de la
    // pregunta — en "cuántos contratos tuvo Giovanny García" esas son
    // "cuantos contratos tuvo", puro ruido interrogativo, no el nombre real
    // (confirmado a mano: eso buscado en SECOP da 0 resultados aunque
    // "giovanny garcia" sí existe). Se descartan las palabras genéricas de
    // pregunta/verbo antes de elegir qué mandar a buscar.
    const palabrasGenericas = new Set([
      'cuantos', 'cuanto', 'cuantas', 'cuanta', 'contratos', 'contrato', 'tuvo', 'tiene', 'tienen', 'tenido',
      'gastado', 'gasto', 'gastó', 'dime', 'busca', 'buscar', 'buscalo', 'buscarlos', 'sobre', 'para', 'este',
      'esta', 'estos', 'estas', 'año', 'años', 'meses', 'quien', 'quién', 'quiere', 'quieres', 'saber', 'informacion',
      'información', 'poder', 'puedes', 'podrias', 'podrías', 'favor', 'dame', 'municipio', 'ciudad', 'departamento',
      'territorio', 'total', 'valor',
    ]);
    // El nombre del territorio (ciudad/departamento) también hay que
    // excluirlo: ya se filtra aparte vía `ciudad`/`departamento` en el
    // where — si se cuela como uno de los tokens de búsqueda, exige que
    // "tocancipa" aparezca en el mismo campo que "giovanny"/"garcia", cosa
    // que nunca pasa (el nombre de la persona y el de la ciudad rara vez
    // conviven en el mismo campo de texto) y la búsqueda falla siempre.
    const tokensTerritorio = new Set(
      [...(ciudad ? normalizar(ciudad).split(' ') : []), ...(departamento ? normalizar(departamento).split(' ') : [])],
    );
    const palabras = mensaje
      .replace(/[¿?¡!.,]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((p) => p.length >= 4 && !palabrasGenericas.has(normalizar(p)) && !tokensTerritorio.has(normalizar(p)));
    if (palabras.length < 2) return null;

    try {
      const rows = await this.ingestion.buscarPorTextoLibreEnVivo({ departamento, ciudad, limit: 20 }, palabras.slice(0, 3).join(' '));
      if (rows.length === 0) return null;

      const valorTotal = rows.reduce((s, r) => s + (Number(r.valor_del_contrato) || 0), 0);
      const entidades = [...new Set(rows.map((r) => r.nombre_entidad).filter(Boolean))];
      const detalle = rows
        .slice(0, 5)
        .map((r) => `${String(r.nombre_entidad || '').slice(0, 30).padEnd(30)} $${(Number(r.valor_del_contrato) || 0).toLocaleString('es-CO')}`)
        .join('\n');

      const texto = `No lo tenía en lo ya sincronizado, así que busqué directo en SECOP: encontré ${rows.length} contrato(s) relacionados por un total de $${valorTotal.toLocaleString('es-CO')}, en: ${entidades.join(', ')}.\n\n${detalle}\n\n(Búsqueda en vivo, no coincidencia exacta por cédula — confirma que es lo que buscabas. Si querés que quede disponible para consultas más rápidas la próxima vez, sincroniza este territorio.)`;
      const datosVivo = {
        totalRows: rows.length,
        valorTotal,
        entidades,
        detalle: rows.slice(0, 5).map((r) => ({
          entidad: String(r.nombre_entidad || 'Sin entidad'),
          valor: Number(r.valor_del_contrato) || 0,
        })),
      };
      const presentacion = await generarPresentacion(
        mensaje,
        datosVivo,
        'Búsqueda en vivo contra SECOP — datos que no estaban sincronizados localmente',
      ) ?? fallbackBusquedaEnVivo(datosVivo);
      return { texto, presentacion };
    } catch (err) {
      this.logger.warn(`Búsqueda en vivo en SECOP falló: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Mismo filtro que civic-intel.service.ts (palabrasConSinonimos sobre la
   * pregunta completa) — sin esto, preguntas como "¿cuánto se ha gastado en
   * mantenimiento de vías?" devolvían el total del municipio entero,
   * ignorando "vías" por completo (confirmado con datos reales).
   */
  private async respuestaPorTema(mensaje: string, contratos: Contrato[], territorio: string, totalTerritorio: number): Promise<{ texto: string; presentacion: Presentation } | null> {
    const palabras = palabrasConSinonimos(mensaje);
    if (!palabras.length) return null;
    const regex = new RegExp(palabras.join('|'), 'i');
    const filtrados = contratos.filter((c) => regex.test(c.textoNormalizado || ''));
    if (filtrados.length === 0 || filtrados.length === contratos.length) return null;

    const valorTema = filtrados.reduce((s, c) => s + (c.valorDelContrato || 0), 0);
    const proveedoresTema = new Set(filtrados.map((c) => c.nitProveedor || c.proveedorAdjudicado)).size;
    const texto = `Sobre eso específicamente, en ${territorio} encontré ${filtrados.length} contrato(s) relacionados por un total de $${valorTema.toLocaleString('es-CO')}, con ${proveedoresTema} proveedor(es) — de los ${totalTerritorio} contratos totales del territorio.`;
    const datosTema = {
      territorio,
      totalFiltrados: filtrados.length,
      totalTerritorio,
      valorTema,
      proveedoresTema,
    };
    const presentacion = await generarPresentacion(
      mensaje,
      datosTema,
      `Filtrado por tema dentro de ${territorio}`,
    ) ?? fallbackTema(datosTema);
    return { texto, presentacion };
  }

  private async buscarRespuestaPorPersona(mensaje: string, contratos: Contrato[]): Promise<{ texto: string; presentacion: Presentation } | null> {
    const tokensPregunta = new Set(normalizar(mensaje).split(' ').filter((t) => t.length >= 4));
    if (tokensPregunta.size < 2) return null;

    const coincidencias = contratos.filter((c) => {
      for (const nombre of [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto, c.nombreSupervisor]) {
        if (!nombre) continue;
        const tokensNombre = new Set(normalizar(nombre).split(' ').filter((t) => t.length >= 4));
        if (tokensNombre.size === 0) continue;
        const compartidos = [...tokensPregunta].filter((t) => tokensNombre.has(t)).length;
        if (compartidos >= Math.min(3, tokensNombre.size) && compartidos >= 2) return true;
      }
      return false;
    });
    if (coincidencias.length === 0) return null;

    const valorTotal = coincidencias.reduce((s, c) => s + (c.valorDelContrato || 0), 0);
    const entidades = [...new Set(coincidencias.map((c) => c.nombreEntidad))];
    const detalle = coincidencias
      .slice(0, 5)
      .map((c) => `${c.nombreEntidad.slice(0, 30).padEnd(30)} $${c.valorDelContrato.toLocaleString('es-CO')}`)
      .join('\n');

    const texto = `Encontré ${coincidencias.length} contrato(s) donde esa persona aparece como firmante, ordenador del gasto o supervisor, por un total de $${valorTotal.toLocaleString('es-CO')}, en: ${entidades.join(', ')}.\n\n${detalle}\n\n(Coincidencia por nombre, no por cédula — confirma que es la misma persona antes de sacar conclusiones.)`;
    const datosPersona = {
      totalContratos: coincidencias.length,
      valorTotal,
      entidades,
      detalle: coincidencias.slice(0, 10).map((c) => ({
        entidad: c.nombreEntidad,
        valor: c.valorDelContrato,
      })),
    };
    const presentacion = await generarPresentacion(
      mensaje,
      datosPersona,
      'Búsqueda por persona — contratos donde aparece como firmante/ordenador/supervisor',
    ) ?? fallbackPersona(datosPersona);
    return { texto, presentacion };
  }

  private async redactar(mensaje: string, datos: ReturnType<never> | any): Promise<{ respuesta: string; presentacion: Presentation }> {
    const fallback = (): { respuesta: string; presentacion: Presentation } => {
      const lineas = [
        `En ${datos.territorio} encontré ${datos.totalContratos} contratos por $${datos.valorTotalContratado.toLocaleString('es-CO')}, con ${datos.proveedoresUnicos} proveedores distintos.`,
      ];
      if (datos.topProveedores.length) {
        lineas.push('', 'Proveedores con más valor adjudicado:');
        for (const p of datos.topProveedores) {
          lineas.push(`- ${p.nombre}: $${p.valor.toLocaleString('es-CO')} (${Math.round(p.porcentaje)}%)`);
        }
      }
      if (datos.presupuesto) lineas.push('', datos.presupuesto);
      return { respuesta: lineas.join('\n'), presentacion: fallbackResumen(datos) };
    };

    try {
      const raw = await completar({
        system: `Eres Anna María, la asistente cívica experta de RadarAI. Analizas datos de contratación pública colombiana y los presentas de forma INTUITIVA y visual para cualquier ciudadano.

DEBES responder ÚNICAMENTE con un JSON válido (sin markdown, sin backticks) con esta forma:

{
  "respuesta": "Tu análisis en 2-4 frases, tono cercano, sin inventar cifras. Resalta lo más importante: patrones, riesgos, concentración.",
  "presentacion": {
    "version": "1.0",
    "template": "summary|ranking|comparison|steps|alert",
    "eyebrow": "texto corto opcional arriba del título",
    "title": "HALLAZGO principal — concreto, no genérico",
    "summary": "1-2 oraciones de contexto para el ciudadano",
    "blocks": [/* bloques visuales */]
  }
}

BLOQUES DISPONIBLES (usa solo los que tengan sentido, máximo 4):

METRICS — cifras destacadas:
{ "id": "único", "type": "metrics", "items": [{ "id": "único", "label": "qué mide", "value": "cifra formateada con $ colombiano", "icon": "briefcase|wallet|trend|shield|alert|people|building-2|calendar", "tone": "neutral|positive|warning|critical" }] }

RANKING — proveedores o entidades con barra de progreso:
{ "id": "único", "type": "ranking", "title": "...", "subtitle": "opcional", "items": [{ "id": "único", "name": "nombre", "value": "$valor", "percentage": 0-100, "detail": "nota" }] }

TABLE — datos tabulares:
{ "id": "único", "type": "table", "title": "...", "columns": [{ "id": "col", "label": "..." }], "rows": [{ "id": "fila", "cells": { "col": "valor" } }] }

NOTICE — alertas o disclaimers importantes:
{ "id": "único", "type": "notice", "title": "...", "content": "...", "tone": "neutral|positive|warning|critical" }

TEXT — párrafos explicativos:
{ "id": "único", "type": "text", "title": "...", "paragraphs": ["..."], "bullets": ["..."] }

PRINCIPIO CLAVE: Piensa como diseñador UX. La info debe verse BONITA e INTUITIVA. Un ciudadano que no sabe nada de contratación debe entender al instante qué está pasando. Si hay un proveedor con >50% del valor, eso es una alerta visual roja. Si hay concentración, el título debe decirlo directo. Nunca muestres datos crudos — siempre organízalos visualmente.`,
        prompt: `Pregunta del ciudadano: "${mensaje}"\n\nDatos reales: ${JSON.stringify(datos)}`,
        maxTokens: 900,
      });

      if (!raw) return fallback();

      const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (!parsed.presentacion || !parsed.presentacion.title || !Array.isArray(parsed.presentacion.blocks)) {
        return fallback();
      }

      parsed.presentacion.version = '1.0';
      return {
        respuesta: parsed.respuesta || fallback().respuesta,
        presentacion: parsed.presentacion,
      };
    } catch (err) {
      this.logger.warn(`No se pudo redactar con IA: ${(err as Error).message}`);
      return fallback();
    }
  }
}
