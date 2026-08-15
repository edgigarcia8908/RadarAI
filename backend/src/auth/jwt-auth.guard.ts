import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CeoAuthClient } from '@ceo-core/auth-client';
import { CEO_AUTH_CLIENT } from './ceo-auth-client.provider';

/** Valida el access token localmente contra el JWKS de ceo-auth-service (sin llamar al servicio en cada request). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(CEO_AUTH_CLIENT) private readonly authClient: CeoAuthClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    if (!token) throw new UnauthorizedException('Falta el token de acceso.');

    try {
      const decoded = await this.authClient.verifyToken(token);
      request.user = { userId: decoded.userId, email: decoded.email, roles: decoded.roles };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}
