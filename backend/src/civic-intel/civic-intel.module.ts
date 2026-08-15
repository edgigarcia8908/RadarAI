import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { CivicIntelService } from './civic-intel.service';
import { CivicIntelController } from './civic-intel.controller';

@Module({
  imports: [IngestionModule],
  controllers: [CivicIntelController],
  providers: [CivicIntelService],
})
export class CivicIntelModule {}
