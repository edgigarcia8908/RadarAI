/**
 * Cliente delgado para el servicio central de IA/RAG/geocoding
 * (`intelligence.ceoclick.pro`, o local en desarrollo) — vendorizado
 * directo en este repo para que sea autocontenido. Solo arma los POST
 * (documents/parse, rag/query, rag/ingest, ai/complete, geo/geocode) con el
 * header de llave de servicio, sin lógica de negocio propia — el
 * retrieval/embeddings/LLM real vive en el servicio, no acá.
 */

export interface IntelligenceClientConfig {
  baseUrl: string;
  appId: string;
  serviceKey: string;
}

export interface ParsedDocumentResult {
  pages: { pageNumber: number; text: string }[];
  metadata: any;
  totalTokensApprox: number;
}

export type RagLlmProvider = 'gemini' | 'openai' | 'anthropic';

export interface RagQueryInput {
  collection: string;
  query: string;
  topK?: number;
  embeddingProvider?: 'openai' | 'gemini';
  answerProvider?: RagLlmProvider;
}

export interface RagQueryResult {
  answer: string;
  citations: { id: string | number; score: number; file?: string; page?: number }[];
  matches: any[];
}

export interface RagIngestChunk {
  text: string;
  metadata?: Record<string, any>;
}

export interface RagIngestInput {
  collection: string;
  sourceId?: string;
  text?: string;
  chunks?: (string | RagIngestChunk)[];
  metadata?: Record<string, any>;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingProvider?: 'openai' | 'gemini';
}

export interface RagIngestResult {
  collection: string;
  chunksIngested: number;
  pointIds: string[];
}

export type AiProvider = 'anthropic' | 'openai';

export interface AiCompleteInput {
  provider?: AiProvider;
  model?: string;
  prompt?: string;
  messages?: { role: 'user' | 'assistant' | 'system'; content: string }[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiCompleteResult {
  content: string;
  provider: AiProvider;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  estimatedCostUsd: number;
}

export type GeoProvider = 'nominatim' | 'google' | 'mapbox';

export interface GeocodeResult {
  lat: number;
  lng: number;
  provider: GeoProvider;
  formattedAddress?: string;
  cached: boolean;
}

export class CeoIntelligenceClient {
  constructor(private config: IntelligenceClientConfig) {}

  private get apiUrl() {
    return this.config.baseUrl.replace(/\/$/, '');
  }

  private get headers() {
    return { 'X-Service-Key': this.config.serviceKey };
  }

  private async handle(res: Response) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data.message || `ceo-intelligence-service respondió ${res.status}`);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  private async post(path: string, body: any) {
    const res = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers },
      body: JSON.stringify(body),
    });
    return this.handle(res);
  }

  async parseDocument(input: { fileBuffer?: Buffer; fileName?: string; fileUrl?: string }): Promise<ParsedDocumentResult> {
    if (input.fileBuffer) {
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(input.fileBuffer)]), input.fileName || 'document.pdf');
      formData.append('appId', this.config.appId);
      const res = await fetch(`${this.apiUrl}/documents/parse`, { method: 'POST', headers: this.headers, body: formData });
      return this.handle(res);
    }
    return this.post('/documents/parse', { fileUrl: input.fileUrl, appId: this.config.appId });
  }

  async ragQuery(input: RagQueryInput): Promise<RagQueryResult> {
    return this.post('/rag/query', { ...input, appId: this.config.appId });
  }

  async ragIngest(input: RagIngestInput): Promise<RagIngestResult> {
    return this.post('/rag/ingest', { ...input, appId: this.config.appId });
  }

  async aiComplete(input: AiCompleteInput): Promise<AiCompleteResult> {
    return this.post('/ai/complete', { ...input, appId: this.config.appId });
  }

  async geocode(address: string, provider?: GeoProvider): Promise<GeocodeResult> {
    return this.post('/geo/geocode', { address, provider });
  }
}
