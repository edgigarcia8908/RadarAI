import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { SetMetadata, Injectable, CanActivate, ExecutionContext, Optional, Inject } from '@nestjs/common';

/**
 * Cliente delgado para el servicio central de identidad
 * (`auth.ceoclick.pro`) — vendorizado directo en este repo para que sea
 * autocontenido y publicable. Es solo un wrapper de fetch + validación JWT
 * local contra JWKS — no tiene lógica de negocio propia de ningún proyecto.
 */

export interface AuthClientConfig {
  baseUrl?: string;
  appId: string;
  jwksCacheMs?: number;
}

export interface DecodedUser {
  userId: string;
  email: string;
  appId: string;
  roles: string[];
}

export class CeoAuthClient {
  private jwksCache: { keys: any[]; fetchedAt: number } | null = null;

  constructor(private config: AuthClientConfig) {
    if (!this.config.baseUrl) {
      this.config.baseUrl = process.env.NODE_ENV === 'production' ? 'https://auth.ceoclick.pro/api' : 'http://localhost:4100/api';
    }
  }

  private get apiUrl() {
    return this.config.baseUrl!.replace(/\/$/, '');
  }

  private get jwksUrl() {
    return this.apiUrl.replace(/\/api$/, '') + '/.well-known/jwks.json';
  }

  private async getJwks(): Promise<any[]> {
    const cacheMs = this.config.jwksCacheMs ?? 3600_000;
    if (this.jwksCache && Date.now() - this.jwksCache.fetchedAt < cacheMs) return this.jwksCache.keys;
    const res = await fetch(this.jwksUrl);
    if (!res.ok) throw new Error(`No se pudo obtener JWKS de ${this.jwksUrl} (${res.status})`);
    const data = await res.json();
    this.jwksCache = { keys: data.keys, fetchedAt: Date.now() };
    return data.keys;
  }

  private jwkToPem(jwk: any): string {
    const keyObject = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    return keyObject.export({ type: 'spki', format: 'pem' }) as string;
  }

  /** Valida un access token LOCALMENTE (sin llamar al servicio) contra el JWKS cacheado. */
  async verifyToken(accessToken: string): Promise<DecodedUser> {
    const decodedHeader = jwt.decode(accessToken, { complete: true }) as any;
    if (!decodedHeader) throw new Error('Token malformado');

    const keys = await this.getJwks();
    const kid = decodedHeader.header.kid;
    const jwk = keys.find((k) => k.kid === kid) || keys[0];
    if (!jwk) throw new Error('No hay llave pública disponible para validar el token');

    const pem = this.jwkToPem(jwk);
    const payload = jwt.verify(accessToken, pem, { algorithms: ['RS256'] }) as any;

    if (payload.appId !== this.config.appId) {
      throw new Error(`Token emitido para otra app (${payload.appId}), no para ${this.config.appId}`);
    }
    return { userId: payload.sub, email: payload.email, appId: payload.appId, roles: payload.roles || [] };
  }
}

// ---- Roles (jerarquía + guard) ----

export const RoleHierarchy: Record<string, string[]> = {};

export function buildRoleHierarchy(hierarchy: Record<string, string[]>): Record<string, string[]> {
  return { ...hierarchy };
}

export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const ROLE_HIERARCHY = 'ROLE_HIERARCHY';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Optional() @Inject(ROLE_HIERARCHY) private readonly customHierarchy?: Record<string, string[]>) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: string[] | undefined = Reflect.getMetadata(ROLES_KEY, context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.roles) return false;

    const hierarchy = { ...RoleHierarchy, ...(this.customHierarchy || {}) };
    return requiredRoles.some((role) => {
      if (user.roles.includes(role)) return true;
      return user.roles.some((userRole: string) => hierarchy[userRole]?.includes(role));
    });
  }
}
