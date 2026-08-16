import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngestionModule } from '../ingestion/ingestion.module';
import { Alerta, AlertaSchema } from './alertas.schema';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Alerta.name, schema: AlertaSchema }]),
    IngestionModule,
  ],
  controllers: [AlertasController],
  providers: [AlertasService],
})
export class AlertasModule {}