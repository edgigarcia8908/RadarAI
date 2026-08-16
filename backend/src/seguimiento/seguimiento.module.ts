import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { SeguimientoController } from './seguimiento.controller';
import { SeguimientoService } from './seguimiento.service';

@Module({
  imports: [IngestionModule],
  controllers: [SeguimientoController],
  providers: [SeguimientoService],
})
export class SeguimientoModule {}