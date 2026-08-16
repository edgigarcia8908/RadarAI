import { Module } from '@nestjs/common';
import { SituacionService } from './situacion.service';
import { SituacionController } from './situacion.controller';

@Module({
  controllers: [SituacionController],
  providers: [SituacionService],
})
export class SituacionModule {}