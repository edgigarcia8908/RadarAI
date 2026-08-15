import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Veeduria, VeeduriaSchema } from './veeduria.schema';
import { VeeduriasService } from './veedurias.service';
import { VeeduriasController } from './veedurias.controller';
import { StorageModule } from '../storage/storage.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Veeduria.name, schema: VeeduriaSchema }]), StorageModule, IntelligenceModule],
  controllers: [VeeduriasController],
  providers: [VeeduriasService],
  exports: [VeeduriasService],
})
export class VeeduriasModule {}
