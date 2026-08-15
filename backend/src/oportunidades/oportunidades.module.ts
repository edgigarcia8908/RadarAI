import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { EmpresasModule } from '../empresas/empresas.module';
import { OportunidadesService } from './oportunidades.service';
import { OportunidadesController } from './oportunidades.controller';

@Module({
  imports: [IngestionModule, EmpresasModule],
  controllers: [OportunidadesController],
  providers: [OportunidadesService],
})
export class OportunidadesModule {}
