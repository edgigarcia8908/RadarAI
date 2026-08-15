import { Module } from '@nestjs/common';
import { DivipolaService } from './divipola.service';

@Module({
  providers: [DivipolaService],
  exports: [DivipolaService],
})
export class DivipolaModule {}
