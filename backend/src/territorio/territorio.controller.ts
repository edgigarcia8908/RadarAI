import { Controller, Get, Inject, Query } from '@nestjs/common';
import { TerritorioService } from './territorio.service';

@Controller('territorio')
export class TerritorioController {
  constructor(@Inject(TerritorioService) private readonly service: TerritorioService) {}

  @Get('contexto')
  contexto(@Query('ciudad') ciudad: string) {
    return this.service.contexto(ciudad || '');
  }
}
