import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { EmpresasService, CrearEmpresaInput } from './empresas.service';

@Controller('empresas')
export class EmpresasController {
  constructor(@Inject(EmpresasService) private readonly service: EmpresasService) {}

  @Post()
  crear(@Body() body: CrearEmpresaInput) {
    return this.service.crear(body);
  }

  @Get()
  listar() {
    return this.service.listar();
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.service.obtener(id);
  }

  @Get(':id/perfil-operativo')
  obtenerPerfilOperativo(@Param('id') id: string) {
    return this.service.obtenerPerfilOperativo(id);
  }

  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() body: Partial<CrearEmpresaInput>) {
    return this.service.actualizar(id, body);
  }
}
