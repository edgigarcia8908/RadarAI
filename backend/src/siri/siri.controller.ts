import { Body, Controller, Inject, Post } from '@nestjs/common';
import { SiriService } from './siri.service';

@Controller('siri')
export class SiriController {
  constructor(@Inject(SiriService) private readonly service: SiriService) {}

  @Post('verificar')
  verificar(@Body() body: { nombres: string[] }) {
    return this.service.buscarVarios(body.nombres || []);
  }
}
