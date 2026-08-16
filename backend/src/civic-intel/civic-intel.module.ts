import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { SiriModule } from '../siri/siri.module';
import { SigepModule } from '../sigep/sigep.module';
import { CivicIntelService } from './civic-intel.service';
import { CivicIntelController } from './civic-intel.controller';

@Module({
  imports: [IngestionModule, SiriModule, SigepModule],
  controllers: [CivicIntelController],
  providers: [CivicIntelService],
  exports: [CivicIntelService],
})
export class CivicIntelModule {}
