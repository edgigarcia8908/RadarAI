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

  async consultar(input: ChatConsultaInput): Promise<{ respuesta: string }> {
    const ciudad = input.ciudad?.trim();
    if (!ciudad) {
      const esSaludo = /^hola|^buenas|^qué tal|^buenos?\s*(días?|tardes?|noches?)|^hi\b|^hello\b/i.test(input.mensaje?.trim() || '');
      return {
        respuesta: esSaludo
          ? `¡Hola! 👋 Soy Anna María, tu asistente cívica en RadarAI. Me alegra que estés aquí.

Para poder darte datos reales y precisos sobre tu municipio, necesito que me digas de dónde eres. En la app, ve a "Entender gasto" o "Ficha territorial", elige tu departamento y municipio, y luego volvemos a charlar — así te cuento con cifras de SECOP II qué está pasando en tu territorio.`
          : `Me encantaría ayudarte, pero para responderte con datos reales de contratos, presupuesto y proveedores necesito saber tu municipio.

En la app, entra a "Entender gasto" o "Ficha territorial", selecciona tu departamento y ciudad, y luego me vuelves a preguntar. Así te traigo la info directo de SECOP II, sin vueltas.`,
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
    };

    const respuesta = await this.redactar(input.mensaje, datosReales);
    return { respuesta };
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
          'Eres Anna María, la asistente cívica experta de RadarAI. Respondes en español, en 3-6 frases, tono cercano para cualquier ciudadano. Analizas los datos reales que te dan (no inventas cifras) y destacas lo más relevante para la pregunta — patrones, riesgos, concentración de proveedores. Si es útil para comparar proveedores, incluye una lista con barras de progreso en texto usando bloques █ y ░ (20 caracteres de ancho) seguidas del porcentaje, una línea por proveedor.',
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
