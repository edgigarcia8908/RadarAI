import { Controller, Get, Inject, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LocalStorageService } from './local-storage.service';

@Controller('storage')
export class StorageController {
  constructor(@Inject(LocalStorageService) private readonly storage: LocalStorageService) {}

  @Get(':id')
  descargar(@Param('id') id: string, @Res() res: Response) {
    if (!this.storage.existe(id)) throw new NotFoundException('Archivo no encontrado');
    return res.sendFile(this.storage.rutaDe(id));
  }
}
