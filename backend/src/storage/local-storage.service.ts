import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Almacenamiento local en disco, dentro de este mismo proyecto — nada de
 * servicios externos. `backend/uploads/` (gitignored, ver .gitignore).
 *
 * Antes esto pegaba a `ceo-storage-service` (servicio privado del resto del
 * ecosistema CEOClick) — se sacó a propósito: este repo se comparte
 * públicamente, y quien lo clone no tiene forma de desplegar ni de
 * conectarse a ese servicio. Guardar en disco local es lo mínimo que
 * cualquiera puede correr con `git clone` + `npm install`, sin cuentas ni
 * credenciales de terceros.
 */
@Injectable()
export class LocalStorageService {
  private readonly baseDir = path.join(process.cwd(), 'uploads');

  constructor() {
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async guardar(buffer: Buffer, filename: string): Promise<{ id: string; url: string; size: number }> {
    const id = crypto.randomUUID();
    const extension = path.extname(filename) || '';
    const rutaDisco = path.join(this.baseDir, `${id}${extension}`);
    await fs.promises.writeFile(rutaDisco, buffer);
    return { id: `${id}${extension}`, url: `/api/storage/${id}${extension}`, size: buffer.length };
  }

  /** Path absoluto en disco a partir del id devuelto por `guardar()` — para servirlo o volver a leerlo. */
  rutaDe(id: string): string {
    // Evita path traversal (../../etc) — el id solo puede referirse a algo dentro de uploads/.
    const nombreSeguro = path.basename(id);
    return path.join(this.baseDir, nombreSeguro);
  }

  existe(id: string): boolean {
    return fs.existsSync(this.rutaDe(id));
  }
}
