import pdfParse from 'pdf-parse';

export interface PaginaTexto {
  pageNumber: number;
  text: string;
}

/**
 * Extrae texto de un PDF localmente (librería `pdf-parse`, corre en el
 * mismo proceso — sin llamar a ningún servicio externo). Solo funciona con
 * PDF "de texto" — un PDF escaneado (imagen sin capa de texto) da texto
 * vacío, no hay OCR acá. `pdf-parse` no separa por página de forma nativa
 * de manera confiable en todas las versiones, así que devolvemos todo el
 * texto como una sola "página" — suficiente para trocear y buscar después,
 * ver `chunkText` en `documentos.service.ts`.
 */
export async function extraerTextoPdf(buffer: Buffer): Promise<{ paginas: PaginaTexto[]; totalCaracteres: number }> {
  const resultado = await pdfParse(buffer);
  const texto = (resultado.text || '').trim();
  return {
    paginas: texto ? [{ pageNumber: 1, text: texto }] : [],
    totalCaracteres: texto.length,
  };
}
