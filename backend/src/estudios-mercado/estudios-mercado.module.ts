import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { EstudiosMercadoService } from './estudios-mercado.service';
import { EstudiosMercadoController } from './estudios-mercado.controller';

@Module({
  imports: [IngestionModule],
  controllers: [EstudiosMercadoController],
  providers: [EstudiosMercadoService],
})
export class EstudiosMercadoModule {}
