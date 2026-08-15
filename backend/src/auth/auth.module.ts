import { Module } from '@nestjs/common';
import { RolesGuard, ROLE_HIERARCHY } from '@ceo-core/auth-client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ceoAuthClientProvider, CEO_AUTH_CLIENT } from './ceo-auth-client.provider';
import { APP_ROLE_HIERARCHY } from './app-roles';

@Module({
  providers: [
    ceoAuthClientProvider,
    JwtAuthGuard,
    RolesGuard,
    { provide: ROLE_HIERARCHY, useValue: APP_ROLE_HIERARCHY },
  ],
  exports: [CEO_AUTH_CLIENT, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
