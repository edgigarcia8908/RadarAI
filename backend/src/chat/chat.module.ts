import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { CuipoModule } from '../cuipo/cuipo.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [IngestionModule, CuipoModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
