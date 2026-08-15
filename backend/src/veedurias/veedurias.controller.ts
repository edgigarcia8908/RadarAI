import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VeeduriasService, CrearVeeduriaInput } from './veedurias.service';
import { Hallazgo, Comentario } from './veeduria.schema';

@Controller('veedurias')
export class VeeduriasController {
  constructor(@Inject(VeeduriasService) private readonly service: VeeduriasService) {}

  @Post()
  crear(@Body() body: CrearVeeduriaInput) {
    return this.service.crear(body);
  }

  @Get()
  listar(@Query('departamento') departamento?: string, @Query('ciudad') ciudad?: string) {
    return this.service.listar({ departamento, ciudad });
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtener(id);
  }

  @Post(':id/hallazgos')
  agregarHallazgo(@Param('id') id: string, @Body() body: Omit<Hallazgo, 'fecha'>) {
    return this.service.agregarHallazgo(id, body);
  }

  @Post(':id/comentarios')
  agregarComentario(@Param('id') id: string, @Body() body: Omit<Comentario, 'fecha'>) {
    return this.service.agregarComentario(id, body);
  }

  @Post(':id/checklist/:indice')
  marcarChecklist(@Param('id') id: string, @Param('indice') indice: string, @Body('hecho') hecho: boolean) {
    return this.service.marcarChecklist(id, Number(indice), hecho);
  }

  @Post(':id/evidencia')
  vincularEvidencia(@Param('id') id: string, @Body() body: { procesoId?: string; contratoId?: string }) {
    return this.service.vincularEvidencia(id, body);
  }

  @Post(':id/colaboradores')
  agregarColaborador(@Param('id') id: string, @Body('colaborador') colaborador: string) {
    return this.service.agregarColaborador(id, colaborador);
  }

  /**
   * Sube un documento que el colaborador ya consiguió MANUALMENTE (ej.
   * descargado de SECOP después de pasar el captcha él mismo — esa parte
   * nunca se automatiza, ver README). A partir de acá sí es automático:
   * sube a ceo-storage-service y, si es PDF de texto, lo indexa.
   */
  @Post(':id/documentos')
  @UseInterceptors(FileInterceptor('file'))
  async subirDocumento(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Body('subidoPor') subidoPor: string) {
    if (!file) throw new BadRequestException('Falta el archivo (campo "file").');
    return this.service.subirDocumento(id, { buffer: file.buffer, filename: file.originalname, mimeType: file.mimetype }, subidoPor || 'anónimo');
  }

  @Post(':id/preguntar')
  preguntarSobreDocumentos(@Param('id') id: string, @Body('pregunta') pregunta: string) {
    return this.service.preguntarSobreDocumentos(id, pregunta);
  }
}
