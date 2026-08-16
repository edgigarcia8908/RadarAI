import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlertasService } from './alertas.service';
import { EstadoAlerta } from './alertas.schema';

@Controller('alertas')
export class AlertasController {
  constructor(@Inject(AlertasService) private readonly service: AlertasService) {}

  /**
   * Carga masiva: CSV de nombres de proveedores (una por línea o con
   * encabezado) contrastado contra SECOP. El procesado es FIFO simple,
   * sin worker pool — el dataset de dev es chico, el de prod se paraleliza.
   */
  @Post('carga')
  @UseInterceptors(FileInterceptor('file'))
  cargar(@UploadedFile() file: Express.Multer.File, @Body('fuente') fuente?: string) {
    if (!file) throw new BadRequestException('Falta el archivo CSV (campo "file").');
    const texto = file.buffer.toString('utf-8');
    if (!texto.trim()) throw new BadRequestException('El archivo está vacío.');
    return this.service.cargarCsv(texto, fuente || file.originalname || 'carga.csv');
  }

  @Get()
  listar(@Query('estado') estado?: EstadoAlerta) {
    return this.service.listar(estado);
  }

  @Post(':id/revisar')
  revisar(@Param('id') id: string) {
    return this.service.marcarRevisada(id);
  }
}