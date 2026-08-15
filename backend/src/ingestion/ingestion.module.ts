import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Proceso, ProcesoSchema } from './proceso.schema';
import { Contrato, ContratoSchema } from './contrato.schema';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proceso.name, schema: ProcesoSchema },
      { name: Contrato.name, schema: ContratoSchema },
    ]),
  ],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService, MongooseModule],
})
export class IngestionModule {}
