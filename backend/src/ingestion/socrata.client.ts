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
  /** `$select` de Socrata — permite agregaciones server-side, ej: "sum(compromisos) as total". */
  select?: string;
  limit?: number;
  offset?: number;
  order?: string;
}

/** Consulta de agregación SoQL (parámetros $select/$group/$where/$order/$limit). */
export interface SocrataAggregateQuery {
  /** Columnas y expresiones a proyectar, ej: ['ciudad_entidad', 'count(*) as total']. Se unen con comas. */
  select: string[];
  /** Columnas de agrupación. Se unen con comas. */
  group?: string[];
  /** Filtros SoQL crudos ya armados por el llamador (con soqlString). Se unen con ' AND '. */
  where?: string[];
  order?: string;
  limit?: number;
}

export class SocrataClient {
  constructor(private readonly datasetId: string) {}

  /**
   * Fetch + retry con backoff (500ms * intento). Reintenta respuestas HTTP
   * 500/503 (flakiness conocida de datos.gov.co bajo rate limit anónimo) y
   * también errores de red (fetch() que lanza TypeError por conexión cortada),
   * que son tan frecuentes como los 500/503. Cualquier otro error (SoQL mal
   * formado con 400, URL inválida) se propaga sin reintentar.
   */
  private async fetchJson(url: string, intentos: number): Promise<Record<string, any>[]> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.SOCRATA_APP_TOKEN) headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;

    let ultimoError: Error | null = null;
    for (let intento = 1; intento <= intentos; intento++) {
      let res: Response;
      try {
        res = await fetch(url, { headers });
      } catch (err) {
        // Error de red (conexión cortada, DNS, timeout) — reintentar con backoff.
        ultimoError = err instanceof Error ? err : new Error(String(err));
        if (intento < intentos) await new Promise((r) => setTimeout(r, 500 * intento));
        continue;
      }
      if (res.ok) return res.json();
      const body = await res.text().catch(() => '');
      ultimoError = new Error(`Socrata (${this.datasetId}) respondió ${res.status}: ${body.slice(0, 300)}`);
      if (res.status !== 500 && res.status !== 503) throw ultimoError; // error real (ej. SoQL mal formado) — no reintentar
      if (intento < intentos) await new Promise((r) => setTimeout(r, 500 * intento));
    }
    throw ultimoError;
  }

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
    if (query.select) url.searchParams.set('$select', query.select);
    url.searchParams.set('$limit', String(query.limit ?? 200));
    url.searchParams.set('$offset', String(query.offset ?? 0));
    // Con $select (agregación server-side) el order por defecto `:id` rompe la query;
    // solo se ordena cuando el llamador no proyecta agregaciones.
    if (!query.select) url.searchParams.set('$order', query.order ?? ':id');
    return this.fetchJson(url.toString(), intentos);
  }

  /**
   * Agregación SoQL (group by). Los valores de `where` ya vienen como
   * literales SoQL armados por el llamador (escapados con soqlString), esta
   * clase solo los une con ' AND '.
   */
  async aggregate(query: SocrataAggregateQuery, intentos = 3): Promise<Record<string, any>[]> {
    return this.fetchJson(buildAggregateUrl(this.datasetId, query), intentos);
  }
}

/**
 * Arma la URL de agregación SoQL sin tocar la red — pura, para poder testear
 * el armado sin depender de datos.gov.co.
 */
export function buildAggregateUrl(datasetId: string, query: SocrataAggregateQuery): string {
  const url = new URL(`https://www.datos.gov.co/resource/${datasetId}.json`);
  url.searchParams.set('$select', query.select.join(','));
  if (query.group?.length) url.searchParams.set('$group', query.group.join(','));
  if (query.where?.length) url.searchParams.set('$where', query.where.join(' AND '));
  if (query.order) url.searchParams.set('$order', query.order);
  url.searchParams.set('$limit', String(query.limit ?? 200));
  return url.toString();
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

/** SECOP manda booleanos como texto "Si"/"No" (a veces con tilde, a veces no). */
export function toBool(value: unknown): boolean {
  const s = String(value).trim().toLowerCase();
  return s === 'si' || s === 'sí' || s === 'true';
}