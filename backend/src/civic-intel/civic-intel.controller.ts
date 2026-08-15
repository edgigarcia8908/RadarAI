import { Body, Controller, Post } from '@nestjs/common';
import { CivicIntelService, ConsultaInput } from './civic-intel.service';

@Controller('civic-intel')
export class CivicIntelController {
  constructor(private readonly service: CivicIntelService) {}

  @Post('consulta')
  consultar(@Body() body: ConsultaInput) {
    return this.service.consultar(body);
  }
}
