/** Split simple por caracteres con solapamiento — sin dependencias externas de chunking semántico. */
export function chunkTexto(texto: string, chunkSize = 1200, overlap = 150): string[] {
  const limpio = texto.trim();
  if (!limpio) return [];
  if (limpio.length <= chunkSize) return [limpio];

  const chunks: string[] = [];
  let start = 0;
  while (start < limpio.length) {
    const end = Math.min(start + chunkSize, limpio.length);
    chunks.push(limpio.slice(start, end));
    if (end === limpio.length) break;
    start = end - overlap;
  }
  return chunks;
}
