import { buildRoleHierarchy } from '@ceo-core/auth-client';

/**
 * Los tres mercados del documento de producto son roles, no apps distintas:
 * CIUDADANO consulta y organiza veedurías; EMPRESA gestiona su perfil de
 * oferta y ve oportunidades; INVESTIGADOR tiene acceso a análisis agregado.
 * ADMIN es el equipo RadarAI. Fase 1: el guard de "dueño del recurso" (una
 * veeduría, un perfil de empresa) queda para Fase 2, igual que en
 * ceo-ecosistema — hoy es solo convención de uso en la demo.
 */
export const AppRole = {
  ADMIN: 'ADMIN',
  INVESTIGADOR: 'INVESTIGADOR',
  EMPRESA: 'EMPRESA',
  CIUDADANO: 'CIUDADANO',
} as const;

export const APP_ROLE_HIERARCHY = buildRoleHierarchy({
  [AppRole.ADMIN]: [AppRole.INVESTIGADOR, AppRole.EMPRESA, AppRole.CIUDADANO],
  [AppRole.INVESTIGADOR]: [],
  [AppRole.EMPRESA]: [],
  [AppRole.CIUDADANO]: [],
});
