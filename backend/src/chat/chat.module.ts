import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { CuipoModule } from '../cuipo/cuipo.module';
import { CivicIntelModule } from '../civic-intel/civic-intel.module';
import { SiriModule } from '../siri/siri.module';
import { SigepModule } from '../sigep/sigep.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [IngestionModule, CuipoModule, CivicIntelModule, SiriModule, SigepModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
