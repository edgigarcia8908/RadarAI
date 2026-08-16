/**
 * Formatea valores en pesos colombianos de forma legible para alertas y resúmenes:
 * - >= 1 billón (1e12): "$1,89 B"
 * - >= 1.000 millones (1e9): "$1.886 M"
 * - >= 1 millón (1e6): "$187 M"
 * - < 1 millón: "$950.000"
 */
export function formatearPesos(valor: number): string {
  if (valor == null || isNaN(valor)) return '$0';

  const abs = Math.abs(valor);
  const signo = valor < 0 ? '-' : '';

  if (abs >= 1e12) {
    const billones = abs / 1e12;
    return `${signo}$${billones.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} B`;
  }

  if (abs >= 1e9) {
    const millones = Math.round(abs / 1e6);
    return `${signo}$${millones.toLocaleString('es-CO')} M`;
  }

  if (abs >= 1e6) {
    const millones = abs / 1e6;
    return `${signo}$${millones.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} M`;
  }

  return `${signo}$${abs.toLocaleString('es-CO')}`;
}
