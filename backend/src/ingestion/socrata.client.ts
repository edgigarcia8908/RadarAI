/**
 * Cliente mínimo para la API SODA de Socrata que usa datos.gov.co. Sin
 * `SOCRATA_APP_TOKEN` funciona igual (datasets públicos), solo con rate
 * limit más bajo — ver https://dev.socrata.com/docs/app-tokens.html.
 */
export interface SocrataQuery {
  /** Filtro SoQL crudo, ej: "departamento_entidad = 'Cundinamarca'". Se combinan con AND. */
  where?: string[];
  /** Búsqueda de texto libre across todas las columnas de texto (parámetro $q de Socrata). */
  q?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

export class SocrataClient {
  constructor(private readonly datasetId: string) {}

  /**
   * `jbjy-vk9h` (Contratos Electrónicos, 85 columnas) en particular devuelve
   * 500/503 con bastante frecuencia sin `SOCRATA_APP_TOKEN` — verificado a
   * mano: la misma query a veces da 500, a veces 503, a veces 200 con datos
   * reales, sin cambiar nada. No es un error del cliente, es la API pública
   * de datos.gov.co bajo carga/rate-limit anónimo. Reintenta con backoff
   * antes de rendirse.
   */
  async fetchRows(query: SocrataQuery = {}, intentos = 3): Promise<Record<string, any>[]> {
    const url = new URL(`https://www.datos.gov.co/resource/${this.datasetId}.json`);
    if (query.where?.length) url.searchParams.set('$where', query.where.join(' AND '));
    if (query.q) url.searchParams.set('$q', query.q);
    url.searchParams.set('$limit', String(query.limit ?? 200));
    url.searchParams.set('$offset', String(query.offset ?? 0));
    url.searchParams.set('$order', query.order ?? ':id');

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.SOCRATA_APP_TOKEN) headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;

    let ultimoError: Error | null = null;
    for (let intento = 1; intento <= intentos; intento++) {
      const res = await fetch(url.toString(), { headers });
      if (res.ok) return res.json();
      const body = await res.text().catch(() => '');
      ultimoError = new Error(`Socrata (${this.datasetId}) respondió ${res.status}: ${body.slice(0, 300)}`);
      if (res.status !== 500 && res.status !== 503) throw ultimoError; // error real (ej. SoQL mal formado) — no reintentar
      if (intento < intentos) await new Promise((r) => setTimeout(r, 500 * intento));
    }
    throw ultimoError;
  }
}

export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function toDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Escapa comillas simples para armar filtros SoQL sin abrir paso a injection. */
export function soqlString(value: string): string {
  return value.replace(/'/g, "''");
}
