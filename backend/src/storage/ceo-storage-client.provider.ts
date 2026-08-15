import { Provider } from '@nestjs/common';
import { CeoStorageClient } from '../lib/storage-client';
import { APP_ID } from '../auth/ceo-auth-client.provider';

export const CEO_STORAGE_CLIENT = 'CEO_STORAGE_CLIENT';

export const ceoStorageClientProvider: Provider = {
  provide: CEO_STORAGE_CLIENT,
  useFactory: () =>
    new CeoStorageClient({
      baseUrl: (process.env.CEO_STORAGE_SERVICE_URL || 'https://storage.ceoclick.pro/api').replace(/\/$/, ''),
      appId: APP_ID,
      serviceKey: process.env.STORAGE_SERVICE_KEY || '',
    }),
};
