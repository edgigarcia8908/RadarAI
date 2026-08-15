import { normalizar } from './normalizar';

/**
 * Stopwords en español — lo mínimo para que "vendemos computadores y
 * servidores para el sector educativo" no genere ruido con "y"/"para"/"el".
 * No es NLP real, es un filtro de palabras vacías suficiente para el MVP.
 */
const STOPWORDS = new Set([
  'de','la','el','los','las','un','una','unos','unas','y','o','para','por','con','sin','en','a','al','del',
  'que','se','su','sus','como','mas','pero','sobre','entre','tambien','este','esta','estos','estas','ya',
  'es','son','fue','ser','muy','todo','toda','todos','todas','nuestro','nuestra','nuestros','nuestras',
]);

/**
 * Convierte un texto libre ("Vendemos computadores empresariales, servidores
 * y soluciones de infraestructura tecnológica") en un set de palabras clave
 * normalizadas. Es el "perfil semántico" simplificado — sin embeddings, como
 * la Fase 1 de `ceo-ecosistema` usa Jaccard de tags en vez de similitud
 * semántica real. El reemplazo natural (embeddings vía
 * `ceo-intelligence-service`) queda documentado en el README, mismo patrón.
 */
export function extraerPalabrasClave(texto: string): string[] {
  const palabras = normalizar(texto).split(' ').filter((p) => p.length > 3 && !STOPWORDS.has(p));
  return [...new Set(palabras)];
}
