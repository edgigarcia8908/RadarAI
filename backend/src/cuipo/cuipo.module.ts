import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { CuipoService } from './cuipo.service';
import { CuipoController } from './cuipo.controller';

@Module({
  imports: [IngestionModule],
  controllers: [CuipoController],
  providers: [CuipoService],
  exports: [CuipoService],
})
export class CuipoModule {}
