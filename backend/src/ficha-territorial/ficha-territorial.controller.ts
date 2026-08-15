import { Controller, Get, Inject, Query } from '@nestjs/common';
import { FichaTerritorialService } from './ficha-territorial.service';

@Controller('ficha-territorial')
export class FichaTerritorialController {
  constructor(@Inject(FichaTerritorialService) private readonly service: FichaTerritorialService) {}

  @Get()
  ficha(@Query('departamento') departamento: string | undefined, @Query('ciudad') ciudad: string) {
    return this.service.ficha(departamento, ciudad || '');
  }
}
