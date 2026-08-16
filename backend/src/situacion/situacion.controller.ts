import { Body, Controller, Inject, Post } from '@nestjs/common';
import { SituacionService } from './situacion.service';
import { PreguntaActualidadDto } from './dto/pregunta-actualidad.dto';

@Controller('situacion')
export class SituacionController {
  constructor(@Inject(SituacionService) private readonly service: SituacionService) {}

  @Post('consulta')
  consultar(@Body() body: PreguntaActualidadDto) {
    return this.service.consultar(body);
  }
}