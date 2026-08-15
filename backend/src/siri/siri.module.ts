import { Module } from '@nestjs/common';
import { SiriService } from './siri.service';
import { SiriController } from './siri.controller';

@Module({
  controllers: [SiriController],
  providers: [SiriService],
  exports: [SiriService],
})
export class SiriModule {}
