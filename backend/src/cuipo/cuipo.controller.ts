import { Controller, Get, Inject, Query } from '@nestjs/common';
import { CuipoService } from './cuipo.service';

@Controller('cuipo')
export class CuipoController {
  constructor(@Inject(CuipoService) private readonly service: CuipoService) {}

  @Get('presupuesto')
  presupuesto(@Query('departamento') departamento?: string, @Query('ciudad') ciudad?: string, @Query('fechaDesde') fechaDesde?: string, @Query('fechaHasta') fechaHasta?: string) {
    return this.service.obtenerPresupuesto({ departamento, ciudad: ciudad ?? '', fechaDesde, fechaHasta });
  }
}
