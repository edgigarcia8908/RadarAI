import { Module } from '@nestjs/common';
import { SigepService } from './sigep.service';
import { SigepController } from './sigep.controller';

@Module({
  controllers: [SigepController],
  providers: [SigepService],
  exports: [SigepService],
})
export class SigepModule {}
