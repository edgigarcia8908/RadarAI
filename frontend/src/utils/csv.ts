function escapar(valor: string | number): string {
  const s = String(valor ?? '');
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function descargarCSV(
  nombreArchivo: string,
  columnas: string[],
  filas: (string | number)[][],
): void {
  const encabezado = columnas.map(escapar).join(';');
  const cuerpo = filas.map((fila) => fila.map(escapar).join(';')).join('\r\n');
  const contenido = `\uFEFF${encabezado}\r\n${cuerpo}\r\n`;
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}