/**
 * SECOP II a veces trae errores reales de digitación en `valor_del_contrato`
 * — confirmado con datos reales: un contrato en Soacha, Cundinamarca vino
 * con valorDelContrato = 15.646.771.360.000.000.000 (~15,6 quintillones de
 * pesos, más de 10.000 veces el PIB anual completo de Colombia). Sin filtro,
 * un solo registro corrupto distorsiona cualquier suma agregada (mapa de
 * riesgo, resúmenes de territorio, top proveedores) hasta volverla inútil —
 * confirmado: "Valor contratado" del mapa de riesgo mostraba
 * $15.651.188.090.794.381.000 por ese único contrato.
 *
 * El techo es generoso a propósito (5 billones de pesos = 5×10¹²) — no se
 * conoce ningún contrato público colombiano real que se acerque a esa cifra
 * (los más grandes rondan cientos de miles de millones), así que no debería
 * descartar contratos grandes legítimos por error.
 *
 * No se toca el valor guardado en Mongo (`Contrato.valorDelContrato`,
 * `crudo`) — sigue siendo exactamente lo que reportó SECOP, para que quien
 * audite un contrato puntual vea el dato real y pueda cruzarlo contra la
 * fuente. Este filtro se aplica solo al SUMAR muchos contratos para mostrar
 * un total agregado.
 */
const VALOR_CONTRATO_MAX_PLAUSIBLE = 5_000_000_000_000;

export function valorPlausible(valor: number | undefined | null): number {
  const v = valor || 0;
  return v > 0 && v <= VALOR_CONTRATO_MAX_PLAUSIBLE ? v : 0;
}
