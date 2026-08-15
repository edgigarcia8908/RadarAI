import { Controller, Get, Inject, Body, Post } from '@nestjs/common';
import { CivicIntelService, ConsultaInput } from './civic-intel.service';

@Controller('civic-intel')
export class CivicIntelController {
  constructor(@Inject(CivicIntelService) private readonly service: CivicIntelService) {}

  @Post('consulta')
  consultar(@Body() body: ConsultaInput) {
    return this.service.consultar(body);
  }

  @Get('mapa')
  mapaRiesgo() {
    return this.service.mapaRiesgo();
  }
}
