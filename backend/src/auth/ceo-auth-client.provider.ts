import { Provider } from '@nestjs/common';
import { CeoAuthClient } from '../lib/auth-client';

/** Mismo patrón que ceo-ecosistema/uniminuto/banco-proyectos-asocentro: instancia compartida vía DI. */
export const CEO_AUTH_CLIENT = 'CEO_AUTH_CLIENT';
export const APP_ID = 'radarai';

export const ceoAuthClientProvider: Provider = {
  provide: CEO_AUTH_CLIENT,
  useFactory: () =>
    new CeoAuthClient({
      baseUrl: (process.env.CEO_AUTH_SERVICE_URL || 'https://auth.ceoclick.pro/api').replace(/\/$/, ''),
      appId: APP_ID,
    }),
};
