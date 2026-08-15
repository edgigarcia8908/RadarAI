import { Module } from '@nestjs/common';
import { TerritorioService } from './territorio.service';
import { TerritorioController } from './territorio.controller';

@Module({
  controllers: [TerritorioController],
  providers: [TerritorioService],
})
export class TerritorioModule {}
