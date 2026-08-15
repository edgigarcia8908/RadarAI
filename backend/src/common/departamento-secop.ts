import { normalizar } from './normalizar';

/**
 * SECOP usa la división político-administrativa real de Colombia, donde
 * Bogotá NO es parte de Cundinamarca — es su propio departamento,
 * "Distrito Capital de Bogotá" (verificado a mano contra los dos datasets:
 * 1.2M+ registros con `departamento_entidad="Distrito Capital de Bogotá"`,
 * cero con `departamento_entidad="Cundinamarca" AND ciudad_entidad="Bogotá"`).
 *
 * El selector del frontend (`colombia.json`) anida "Bogotá" bajo
 * "Cundinamarca" a propósito — es como la mayoría de la gente piensa la
 * geografía coloquialmente, y cambiar el selector para separarlas sería más
 * confuso para el usuario común que corregirlo acá, una sola vez, del lado
 * del servidor. Si el usuario elige ciudad="Bogotá", no importa qué
 * departamento haya seleccionado — se usa el departamento real de SECOP.
 *
 * Verificado solo para Bogotá — no se revisaron los otros ~1100 municipios
 * en busca de discrepancias DANE-vs-SECOP similares. Si aparece otro caso,
 * agregarlo acá.
 */
const OVERRIDES_CIUDAD_A_DEPARTAMENTO: Record<string, string> = {
  bogota: 'Distrito Capital de Bogotá',
};

export function departamentoRealSecop(departamento: string | undefined, ciudad: string | undefined): string | undefined {
  if (ciudad) {
    const override = OVERRIDES_CIUDAD_A_DEPARTAMENTO[normalizar(ciudad)];
    if (override) return override;
  }
  return departamento;
}
