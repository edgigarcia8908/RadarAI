import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Veeduria, VeeduriaSchema } from './veeduria.schema';
import { VeeduriasService } from './veedurias.service';
import { VeeduriasController } from './veedurias.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Veeduria.name, schema: VeeduriaSchema }])],
  controllers: [VeeduriasController],
  providers: [VeeduriasService],
  exports: [VeeduriasService],
})
export class VeeduriasModule {}
