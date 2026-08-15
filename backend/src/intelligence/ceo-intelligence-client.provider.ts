import { Provider } from '@nestjs/common';
import { CeoIntelligenceClient } from '../lib/intelligence-client';
import { APP_ID } from '../auth/ceo-auth-client.provider';

export const CEO_INTELLIGENCE_CLIENT = 'CEO_INTELLIGENCE_CLIENT';

export const ceoIntelligenceClientProvider: Provider = {
  provide: CEO_INTELLIGENCE_CLIENT,
  useFactory: () =>
    new CeoIntelligenceClient({
      baseUrl: (process.env.CEO_INTELLIGENCE_SERVICE_URL || 'http://localhost:4400/api').replace(/\/$/, ''),
      appId: APP_ID,
      serviceKey: process.env.INTELLIGENCE_SERVICE_KEY || '',
    }),
};
