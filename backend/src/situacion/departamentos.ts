import { normalizar } from '../common/normalizar';

/**
 * Departamentos de Colombia con nombres canónicos (con tildes), tal como los
 * escribe datos.gov.co en `departamento_entidad` de SECOP II. Incluye Bogotá
 * D.C. — el whitelist que se usa para validar/normalizar territorio.
 */
export const DEPARTAMENTOS_COLOMBIA: readonly string[] = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés, Providencia y Santa Catalina',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
  'Bogotá D.C.',
];

/**
 * Normaliza el input con `normalizar()` (quita tildes/mayúsculas) y devuelve
 * el nombre canónico exacto del whitelist que matchea, o null si no matchea
 * ninguno. Así "cundinamarca", "CUNDINAMARCA" o "Cundinamarca" → "Cundinamarca",
 * y "Atlantico" (sin tilde) matchea "Atlántico".
 */
export function departamentoCanonico(valor: string): string | null {
  const normalizado = normalizar(valor);
  if (!normalizado) return null;
  return DEPARTAMENTOS_COLOMBIA.find((departamento) => normalizar(departamento) === normalizado) ?? null;
}