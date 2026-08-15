/**
 * Cliente delgado para el servicio central de almacenamiento
 * (`storage.ceoclick.pro`) — vendorizado directo en este repo para que sea
 * autocontenido. Solo arma upload()/getUrl()/delete() con el header de
 * llave de servicio, sin lógica de negocio propia.
 */

export interface StorageClientConfig {
  baseUrl: string;
  appId: string;
  serviceKey: string;
}

export interface UploadFileInput {
  buffer: Buffer;
  filename: string;
  mimeType?: string;
  ownerId?: string;
}

export interface UploadFileResult {
  id: string;
  size: number;
  url: string;
}

export class CeoStorageClient {
  constructor(private config: StorageClientConfig) {}

  private get apiUrl() {
    return this.config.baseUrl.replace(/\/$/, '');
  }

  private get headers() {
    return { 'X-Service-Key': this.config.serviceKey };
  }

  async upload(input: UploadFileInput): Promise<UploadFileResult> {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(input.buffer)], { type: input.mimeType || 'application/octet-stream' });
    form.append('file', blob, input.filename);
    form.append('appId', this.config.appId);
    if (input.ownerId) form.append('ownerId', input.ownerId);

    const res = await fetch(`${this.apiUrl}/storage/upload`, { method: 'POST', headers: this.headers, body: form });
    return this.parse(res);
  }

  async getUrl(id: string): Promise<{ url: string }> {
    const res = await fetch(`${this.apiUrl}/storage/${id}/url`, { method: 'GET', headers: this.headers });
    return this.parse(res);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await fetch(`${this.apiUrl}/storage/${id}`, { method: 'DELETE', headers: this.headers });
    return this.parse(res);
  }

  private async parse(res: Response) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err: any = new Error(data.message || `ceo-storage-service respondió ${res.status}`);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }
}
