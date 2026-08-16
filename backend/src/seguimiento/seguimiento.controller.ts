import { Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { SeguimientoService } from './seguimiento.service';

@Controller('seguimiento')
export class SeguimientoController {
  constructor(@Inject(SeguimientoService) private readonly service: SeguimientoService) {}

  @Get('resumen')
  resumen() {
    return this.service.resumen();
  }

  @Get('contratista/:nit')
  async contratista(@Param('nit') nit: string) {
    const perfil = await this.service.contratista(nit);
    if (!perfil) {
      throw new NotFoundException(`No se encontraron contratos para el NIT ${nit}`);
    }
    return perfil;
  }

  @Get('ranking')
  ranking(@Query('limit') limit?: string) {
    const n = limit ? Number.parseInt(limit, 10) : 20;
    return this.service.ranking(Number.isFinite(n) ? n : 20);
  }
}