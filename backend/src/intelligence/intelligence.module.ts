import { Module } from '@nestjs/common';
import { ceoIntelligenceClientProvider, CEO_INTELLIGENCE_CLIENT } from './ceo-intelligence-client.provider';

@Module({
  providers: [ceoIntelligenceClientProvider],
  exports: [CEO_INTELLIGENCE_CLIENT],
})
export class IntelligenceModule {}
