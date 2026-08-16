import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';
import { CuipoService } from '../cuipo/cuipo.service';
import { completar } from '../lib/llm';
import { normalizar } from '../common/normalizar';
import { departamentoRealSecop } from '../common/departamento-secop';

export interface ChatConsultaInput {
  mensaje: string;
  departamento?: string;
  ciudad?: string;
}

/** Barra ASCII "████░░░░ 74%" — el frontend (AnnaMariaChat.jsx) detecta líneas así y las agrupa en un bloque monoespaciado. */
function barraAscii(pct: number, ancho = 20): string {
  const llenos = Math.round((Math.max(0, Math.min(100, pct)) / 100) * ancho);
  return '█'.repeat(llenos) + '░'.repeat(ancho - llenos) + ` ${Math.round(pct)}%`;
}

/**
 * Backend real de "Anna María" — el commit original (`45a5b1f`) registró
 * este módulo en app.module.ts pero nunca subió los archivos. En vez de
 * esperar, se implementa reusando lo que ya existe: el Contrato ya
 * sincronizado en Mongo (mismo patrón que CivicIntelService) + CuipoService
 * para presupuesto + completar() para redactar en lenguaje natural. Sin
 * ANTHROPIC_API_KEY/OPENAI_API_KEY, cae a una plantilla determinística con
 * los mismos números reales — nunca inventa cifras.
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
    @Inject(CuipoService) private readonly cuipo: CuipoService,
  ) {}

  async consultar(input: ChatConsultaInput): Promise<{ respuesta: string; requiereTerritorio?: boolean }> {
    const ciudad = input.ciudad?.trim();
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
        respuesta: esSaludo
          ? `¡Hola! 👋 Soy Anna María, tu asistente cívica en RadarAI. Me alegra que estés aquí.

¿De qué municipio quieres que te hable? Escribe el nombre (por ejemplo "Tocancipá" o "Tocancipá, Cundinamarca") y te cuento con cifras reales de SECOP II.`
          : `Me encantaría ayudarte, pero para responderte con datos reales necesito saber de qué municipio. ¿Cuál es?`,
      };
    }

    const departamentoReal = departamentoRealSecop(input.departamento, ciudad);
    const filtro: Record<string, unknown> = { ciudadNormalizado: normalizar(ciudad) };
    if (departamentoReal) filtro.departamentoNormalizado = normalizar(departamentoReal);

    const contratos = await this.contratoModel.find(filtro).lean<Contrato[]>();

    if (contratos.length === 0) {
      return {
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
    const respuestaPorPersona = this.buscarRespuestaPorPersona(input.mensaje, contratos);
    const respuesta = respuestaPorPersona ?? (await this.redactar(input.mensaje, datosReales));
    return { respuesta };
  }

  private buscarRespuestaPorPersona(mensaje: string, contratos: Contrato[]): string | null {
    const tokensPregunta = new Set(normalizar(mensaje).split(' ').filter((t) => t.length >= 4));
    if (tokensPregunta.size < 2) return null;

    const coincidencias = contratos.filter((c) => {
      for (const nombre of [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto, c.nombreSupervisor]) {
        if (!nombre) continue;
        const tokensNombre = new Set(normalizar(nombre).split(' ').filter((t) => t.length >= 4));
        const compartidos = [...tokensPregunta].filter((t) => tokensNombre.has(t)).length;
        if (compartidos >= 3) return true;
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

    return `Encontré ${coincidencias.length} contrato(s) donde esa persona aparece como firmante, ordenador del gasto o supervisor, por un total de $${valorTotal.toLocaleString('es-CO')}, en: ${entidades.join(', ')}.\n\n${detalle}\n\n(Coincidencia por nombre, no por cédula — confirma que es la misma persona antes de sacar conclusiones.)`;
  }

  private async redactar(mensaje: string, datos: ReturnType<never> | any): Promise<string> {
    const plantilla = () => {
      const lineas = [
        `En ${datos.territorio} encontré ${datos.totalContratos} contratos por $${datos.valorTotalContratado.toLocaleString('es-CO')}, con ${datos.proveedoresUnicos} proveedores distintos.`,
      ];
      if (datos.topProveedores.length) {
        lineas.push('', 'Proveedores con más valor adjudicado:');
        for (const p of datos.topProveedores) {
          lineas.push(`${p.nombre.slice(0, 28).padEnd(28)} ${barraAscii(p.porcentaje)}`);
        }
      }
      if (datos.presupuesto) lineas.push('', datos.presupuesto);
      return lineas.join('\n');
    };

    try {
      const respuesta = await completar({
        system:
          'Eres Anna María, la asistente cívica experta de RadarAI. Respondes en español, en 3-6 frases, tono cercano para cualquier ciudadano. Analizas los datos reales que te dan (no inventas cifras) y destacas lo más relevante para la pregunta — patrones, riesgos, concentración de proveedores. Si la pregunta menciona una persona o entidad puntual, búscala en "muestraContratos" (campos representanteLegal/ordenadorDelGasto/supervisor/proveedor/entidad) y responde específicamente sobre ella; si no aparece ahí, dilo explícitamente en vez de responder solo con el resumen general. Si es útil para comparar proveedores, incluye una lista con barras de progreso en texto usando bloques █ y ░ (20 caracteres de ancho) seguidas del porcentaje, una línea por proveedor.',
        prompt: `Pregunta del ciudadano: "${mensaje}"\n\nDatos reales disponibles: ${JSON.stringify(datos)}`,
        maxTokens: 500,
      });
      return respuesta ?? plantilla();
    } catch (err) {
      this.logger.warn(`No se pudo redactar con IA: ${(err as Error).message}`);
      return plantilla();
    }
  }
}
