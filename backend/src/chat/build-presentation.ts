/**
 * Generación inteligente de presentación para el chat.
 *
 * Flujo:
 * 1. Se le pasa al LLM los datos reales + las instrucciones del schema
 * 2. El LLM analiza y DECIDE qué mostrar, cómo titularlo, qué resaltar
 * 3. Devuelve un JSON de Presentation que el frontend renderiza bonito
 * 4. Si no hay LLM disponible, se genera un fallback determinístico mínimo
 *
 * Lo único "hardcodeado" son las INSTRUCCIONES al LLM (el schema de bloques
 * disponibles). El contenido (títulos, summaries, qué métricas destacar,
 * tono de alertas) lo decide la IA.
 */

import { completar } from '../lib/llm';
import { formatearPesos } from '../common/formatear-pesos';

// ─── Tipos (espejo del frontend home.types.ts) ─────────────────────────────

type ResponseTone = 'neutral' | 'positive' | 'warning' | 'critical';
type ResponseTemplate = 'summary' | 'ranking' | 'comparison' | 'steps' | 'alert';
type IconName = 'briefcase' | 'wallet' | 'trend' | 'shield' | 'alert' | 'sparkle' | 'people' | 'building-2' | 'calendar';

interface MetricItem {
  id: string;
  label: string;
  value: string;
  detail?: string;
  icon?: IconName;
  tone?: ResponseTone;
}

interface RankingItem {
  id: string;
  name: string;
  value?: string;
  percentage?: number;
  detail?: string;
}

interface TextBlock { id: string; type: 'text'; title?: string; paragraphs?: string[]; bullets?: string[]; }
interface MetricsBlock { id: string; type: 'metrics'; items: MetricItem[]; }
interface RankingBlock { id: string; type: 'ranking'; title: string; subtitle?: string; items: RankingItem[]; }
interface TableBlock { id: string; type: 'table'; title?: string; columns: { id: string; label: string }[]; rows: { id: string; cells: Record<string, string> }[]; }
interface NoticeBlock { id: string; type: 'notice'; title: string; content: string; tone: ResponseTone; }
interface StepsBlock { id: string; type: 'steps'; title: string; items: { id: string; title: string; description?: string }[]; }

type ResponseBlock = TextBlock | MetricsBlock | RankingBlock | TableBlock | NoticeBlock | StepsBlock;

export interface Presentation {
  version: '1.0';
  template: ResponseTemplate;
  eyebrow?: string;
  title: string;
  summary?: string;
  blocks: ResponseBlock[];
}

// ─── Instrucciones al LLM (el "schema" de lo que puede generar) ─────────────

const PRESENTATION_SYSTEM_PROMPT = `Eres un analista de datos públicos colombianos. Tu trabajo es analizar los datos que te dan y generar una presentación visual estructurada para un ciudadano.

DEBES responder ÚNICAMENTE con un JSON válido (sin markdown, sin backticks, sin texto antes o después) que siga este schema exacto:

{
  "version": "1.0",
  "template": "summary" | "ranking" | "comparison" | "steps" | "alert",
  "eyebrow": "texto corto opcional encima del título",
  "title": "título principal que resuma el hallazgo más importante",
  "summary": "1-2 oraciones que den contexto al ciudadano",
  "blocks": [...]
}

Bloques disponibles (usa los que tengan sentido para los datos, NO pongas todos siempre):

1. METRICS — para cifras destacadas (máximo 3-4):
   { "id": "único", "type": "metrics", "items": [{ "id": "único", "label": "qué mide", "value": "cifra formateada", "detail": "contexto opcional", "icon": "briefcase|wallet|trend|shield|alert|people|building-2|calendar", "tone": "neutral|positive|warning|critical" }] }

2. RANKING — para listas ordenadas con barras de progreso:
   { "id": "único", "type": "ranking", "title": "...", "subtitle": "opcional", "items": [{ "id": "único", "name": "nombre", "value": "valor opcional", "percentage": 0-100, "detail": "nota opcional" }] }

3. TABLE — para datos tabulares:
   { "id": "único", "type": "table", "title": "opcional", "columns": [{ "id": "col", "label": "Columna" }], "rows": [{ "id": "fila", "cells": { "col": "valor" } }] }

4. NOTICE — para alertas, advertencias o disclaimers:
   { "id": "único", "type": "notice", "title": "...", "content": "...", "tone": "neutral|positive|warning|critical" }

5. STEPS — para instrucciones paso a paso:
   { "id": "único", "type": "steps", "title": "...", "items": [{ "id": "único", "title": "paso", "description": "opcional" }] }

6. TEXT — para párrafos o listas:
   { "id": "único", "type": "text", "title": "opcional", "paragraphs": ["..."], "bullets": ["..."] }

REGLAS:
- Analiza los datos y decide qué es lo más RELEVANTE para la pregunta del ciudadano.
- Si hay concentración de proveedores (>60% en uno solo), eso es una alerta, no solo info.
- Si hay datos de presupuesto que exceden el 100%, es una alerta.
- Usa moneda colombiana ($X.XXX.XXX) para valores.
- Sé concreto y directo. El ciudadano no es experto.
- El título debe ser un hallazgo, no genérico. Ej: "2 proveedores concentran el 85% del gasto" > "Resumen de contratación".
- Los IDs deben ser únicos (usa kebab-case descriptivo).
- Máximo 4 bloques por presentación para no saturar.`;

// ─── Generación con LLM ────────────────────────────────────────────────────

export async function generarPresentacion(
  preguntaUsuario: string,
  datos: Record<string, unknown>,
  contexto: string,
): Promise<Presentation | null> {
  const prompt = `Pregunta del ciudadano: "${preguntaUsuario}"

Contexto: ${contexto}

Datos reales disponibles:
${JSON.stringify(datos, null, 2)}

Genera el JSON de presentación visual. Analiza los datos, encuentra lo más relevante para responder la pregunta, y elige los bloques que mejor comuniquen esa información.`;

  try {
    const raw = await completar({
      system: PRESENTATION_SYSTEM_PROMPT,
      prompt,
      maxTokens: 800,
    });
    if (!raw) return null;

    // Limpiar posibles backticks o texto sobrante
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr) as Presentation;

    // Validación mínima
    if (!parsed.version || !parsed.template || !parsed.title || !Array.isArray(parsed.blocks)) {
      return null;
    }
    parsed.version = '1.0'; // Forzar versión correcta
    return parsed;
  } catch {
    return null;
  }
}

// ─── Fallback determinístico (solo cuando NO hay LLM) ───────────────────────
// Estos builders generan algo decente con los datos reales — pero sin la
// "inteligencia" de decidir qué resaltar o cómo titularlo. Es el mínimo
// para que no se vea texto crudo.

function fmt(valor: number): string {
  return formatearPesos(valor);
}

export interface DatosResumen {
  territorio: string;
  totalContratos: number;
  valorTotalContratado: number;
  proveedoresUnicos: number;
  topProveedores: { nombre: string; valor: number; contratos: number; porcentaje: number }[];
  presupuesto: string | null;
}

export function fallbackResumen(datos: DatosResumen): Presentation {
  const blocks: ResponseBlock[] = [];
  const topProv = datos.topProveedores[0];
  const hayConcentracion = topProv && topProv.porcentaje > 60;

  blocks.push({
    id: 'metrics-main',
    type: 'metrics',
    items: [
      { id: 'total-contratos', label: 'Contratos', value: datos.totalContratos.toLocaleString('es-CO'), icon: 'briefcase', tone: 'positive' },
      { id: 'valor-total', label: 'Valor total', value: fmt(datos.valorTotalContratado), icon: 'wallet', tone: 'warning' },
      { id: 'proveedores', label: 'Proveedores', value: datos.proveedoresUnicos.toLocaleString('es-CO'), icon: 'people', tone: 'neutral' },
    ],
  });

  if (datos.topProveedores.length > 0) {
    blocks.push({
      id: 'ranking-prov',
      type: 'ranking',
      title: hayConcentracion
        ? `${topProv.nombre.slice(0, 30)} concentra el ${Math.round(topProv.porcentaje)}% del valor`
        : `Top ${datos.topProveedores.length} proveedores`,
      subtitle: 'Por valor adjudicado',
      items: datos.topProveedores.map((p, i) => ({
        id: `p-${i}`,
        name: p.nombre,
        value: fmt(p.valor),
        percentage: Math.round(p.porcentaje * 100) / 100,
        detail: `${p.contratos} contrato(s)`,
      })),
    });
  }

  if (datos.presupuesto) {
    blocks.push({
      id: 'presupuesto',
      type: 'notice',
      title: 'Presupuesto municipal',
      content: datos.presupuesto,
      tone: /1[0-9]{2}%|[2-9]\d{2,}%/.test(datos.presupuesto) ? 'critical' : 'neutral',
    });
  }

  // Título dinámico basado en lo que hay
  let title = `${datos.totalContratos} contratos por ${fmt(datos.valorTotalContratado)} en ${datos.territorio}`;
  if (hayConcentracion) {
    title = `Alerta: ${topProv.nombre.slice(0, 25)} tiene el ${Math.round(topProv.porcentaje)}% del gasto en ${datos.territorio}`;
  }

  return {
    version: '1.0',
    template: datos.topProveedores.length > 0 ? 'ranking' : 'summary',
    eyebrow: datos.territorio,
    title,
    summary: `${datos.totalContratos} contratos registrados con ${datos.proveedoresUnicos} proveedores.`,
    blocks,
  };
}

export interface DatosPersona {
  totalContratos: number;
  valorTotal: number;
  entidades: string[];
  detalle: { entidad: string; valor: number }[];
}

export function fallbackPersona(datos: DatosPersona): Presentation {
  const blocks: ResponseBlock[] = [];

  blocks.push({
    id: 'metrics-persona',
    type: 'metrics',
    items: [
      { id: 'contratos', label: 'Contratos', value: datos.totalContratos.toLocaleString('es-CO'), icon: 'briefcase', tone: 'positive' },
      { id: 'valor', label: 'Valor total', value: fmt(datos.valorTotal), icon: 'wallet', tone: 'warning' },
      { id: 'entidades', label: 'Entidades', value: datos.entidades.length.toLocaleString('es-CO'), icon: 'building-2', tone: 'neutral' },
    ],
  });

  if (datos.detalle.length > 0) {
    blocks.push({
      id: 'tabla-detalle',
      type: 'table',
      columns: [{ id: 'entidad', label: 'Entidad' }, { id: 'valor', label: 'Valor' }],
      rows: datos.detalle.slice(0, 8).map((d, i) => ({
        id: `r-${i}`,
        cells: { entidad: d.entidad.slice(0, 45), valor: fmt(d.valor) },
      })),
    });
  }

  blocks.push({
    id: 'disclaimer',
    type: 'notice',
    title: 'Importante',
    content: 'Coincidencia por nombre, no por cédula. Confirma la identidad antes de sacar conclusiones.',
    tone: 'warning',
  });

  return {
    version: '1.0',
    template: 'summary',
    eyebrow: 'Búsqueda por persona',
    title: `${datos.totalContratos} contrato(s) por ${fmt(datos.valorTotal)}`,
    summary: `Aparece en contratos de ${datos.entidades.slice(0, 3).join(', ')}${datos.entidades.length > 3 ? ` y ${datos.entidades.length - 3} más` : ''}.`,
    blocks,
  };
}

export interface DatosTema {
  territorio: string;
  totalFiltrados: number;
  totalTerritorio: number;
  valorTema: number;
  proveedoresTema: number;
}

export function fallbackTema(datos: DatosTema): Presentation {
  const pct = datos.totalTerritorio > 0 ? Math.round((datos.totalFiltrados / datos.totalTerritorio) * 100) : 0;

  return {
    version: '1.0',
    template: 'summary',
    eyebrow: datos.territorio,
    title: `${datos.totalFiltrados} contratos del tema (${pct}% del territorio)`,
    summary: `De ${datos.totalTerritorio} contratos totales, ${datos.totalFiltrados} coinciden con tu búsqueda.`,
    blocks: [{
      id: 'metrics-tema',
      type: 'metrics',
      items: [
        { id: 'filtrados', label: 'Contratos del tema', value: datos.totalFiltrados.toLocaleString('es-CO'), icon: 'briefcase', tone: 'positive' },
        { id: 'valor', label: 'Valor', value: fmt(datos.valorTema), icon: 'wallet', tone: 'warning' },
        { id: 'provs', label: 'Proveedores', value: datos.proveedoresTema.toLocaleString('es-CO'), icon: 'people', tone: 'neutral' },
      ],
    }],
  };
}

export interface DatosBusquedaEnVivo {
  totalRows: number;
  valorTotal: number;
  entidades: string[];
  detalle: { entidad: string; valor: number }[];
}

export function fallbackBusquedaEnVivo(datos: DatosBusquedaEnVivo): Presentation {
  const blocks: ResponseBlock[] = [];

  blocks.push({
    id: 'metrics-vivo',
    type: 'metrics',
    items: [
      { id: 'encontrados', label: 'Encontrados en SECOP', value: datos.totalRows.toLocaleString('es-CO'), icon: 'briefcase', tone: 'positive' },
      { id: 'valor', label: 'Valor total', value: fmt(datos.valorTotal), icon: 'wallet', tone: 'warning' },
    ],
  });

  if (datos.detalle.length > 0) {
    blocks.push({
      id: 'tabla-vivo',
      type: 'table',
      columns: [{ id: 'entidad', label: 'Entidad' }, { id: 'valor', label: 'Valor' }],
      rows: datos.detalle.slice(0, 5).map((d, i) => ({
        id: `r-${i}`,
        cells: { entidad: d.entidad.slice(0, 45), valor: fmt(d.valor) },
      })),
    });
  }

  blocks.push({
    id: 'notice-vivo',
    type: 'notice',
    title: 'Búsqueda en vivo',
    content: 'No estaba en lo sincronizado — se buscó directo en SECOP. Sincroniza el territorio para consultas más rápidas.',
    tone: 'neutral',
  });

  return {
    version: '1.0',
    template: 'summary',
    eyebrow: 'Consulta en vivo a SECOP',
    title: `${datos.totalRows} contrato(s) por ${fmt(datos.valorTotal)}`,
    summary: `En: ${datos.entidades.slice(0, 3).join(', ')}${datos.entidades.length > 3 ? ` y ${datos.entidades.length - 3} más` : ''}.`,
    blocks,
  };
}

export function fallbackSinDatos(ciudad: string): Presentation {
  return {
    version: '1.0',
    template: 'steps',
    eyebrow: 'Sin datos aún',
    title: `No hay datos sincronizados de ${ciudad}`,
    blocks: [{
      id: 'pasos',
      type: 'steps',
      title: 'Para que pueda responder:',
      items: [
        { id: 's1', title: 'Ir a "Entender gasto" o "Vigilar mi territorio"' },
        { id: 's2', title: `Seleccionar ${ciudad}` },
        { id: 's3', title: 'Sincronizar datos' },
        { id: 's4', title: 'Volver aquí y preguntar de nuevo' },
      ],
    }],
  };
}

export function fallbackSaludo(esSaludo: boolean): Presentation {
  return {
    version: '1.0',
    template: 'summary',
    eyebrow: esSaludo ? '¡Hola! 👋' : undefined,
    title: esSaludo ? 'Soy Anna María, tu asistente cívica' : '¿Sobre qué territorio quieres consultar?',
    summary: esSaludo
      ? 'Puedo ayudarte a entender la contratación pública de tu municipio. ¿Cuál es tu territorio?'
      : undefined,
    blocks: [],
  };
}
