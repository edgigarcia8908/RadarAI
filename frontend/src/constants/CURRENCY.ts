/**
 * Formatea valores en pesos colombianos de forma legible:
 * - >= 1 billón (1e12): "$1,89 B"
 * - >= 1.000 millones (1e9): "$1.886 M" (millones)
 * - >= 1 millón (1e6): "$187 M"
 * - < 1 millón: "$950.000" (formato normal)
 *
 * Usa la convención colombiana: "B" = billón (1e12), "M" = millones (1e6).
 */
export function formatearPesos(valor: number): string {
  if (valor == null || isNaN(valor)) return '$0';

  const abs = Math.abs(valor);
  const signo = valor < 0 ? '-' : '';

  if (abs >= 1e12) {
    // Billones (1.000.000.000.000)
    const billones = abs / 1e12;
    return `${signo}$${billones.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} B`;
  }

  if (abs >= 1e9) {
    // Miles de millones — mostrar como millones para claridad
    const millones = Math.round(abs / 1e6);
    return `${signo}$${millones.toLocaleString('es-CO')} M`;
  }

  if (abs >= 1e6) {
    // Millones
    const millones = abs / 1e6;
    return `${signo}$${millones.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} M`;
  }

  // Menor a un millón — formato normal
  return `${signo}$${abs.toLocaleString('es-CO')}`;
}
