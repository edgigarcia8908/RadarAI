import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { OportunidadesService } from './oportunidades.service';

@Controller('oportunidades')
export class OportunidadesController {
  constructor(@Inject(OportunidadesService) private readonly service: OportunidadesService) {}

  @Get('empresa/:empresaId')
  paraEmpresa(@Param('empresaId') empresaId: string, @Query('limit') limit?: string) {
    return this.service.paraEmpresa(empresaId, limit ? Number(limit) : undefined);
  }
}
