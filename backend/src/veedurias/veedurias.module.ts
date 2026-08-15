import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Veeduria, VeeduriaSchema } from './veeduria.schema';
import { VeeduriasService } from './veedurias.service';
import { VeeduriasController } from './veedurias.controller';
import { StorageModule } from '../storage/storage.module';
import { IngestionModule } from '../ingestion/ingestion.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Veeduria.name, schema: VeeduriaSchema }]),
    StorageModule,
    IngestionModule,
  ],
  controllers: [VeeduriasController],
  providers: [VeeduriasService],
  exports: [VeeduriasService],
})
export class VeeduriasModule {}
