import { Body, Controller, Inject, Post } from '@nestjs/common';
import { SigepService } from './sigep.service';

@Controller('sigep')
export class SigepController {
  constructor(@Inject(SigepService) private readonly service: SigepService) {}

  @Post('verificar')
  verificar(@Body() body: { nombres: string[] }) {
    return this.service.buscarVarios(body.nombres || []);
  }
}
