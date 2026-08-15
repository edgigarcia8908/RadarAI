import { Body, Controller, Inject, Post } from '@nestjs/common';
import { EstudiosMercadoService, EstudioMercadoInput } from './estudios-mercado.service';

@Controller('estudios-mercado')
export class EstudiosMercadoController {
  constructor(@Inject(EstudiosMercadoService) private readonly service: EstudiosMercadoService) {}

  @Post()
  generar(@Body() body: EstudioMercadoInput) {
    return this.service.generarEstudio(body);
  }
}
