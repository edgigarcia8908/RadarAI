/**
 * Normaliza texto para comparar/buscar sin que difiera por tildes,
 * mayúsculas o puntuación — SECOP no es consistente en cómo cada entidad
 * escribe nombres de municipios, objetos contractuales, etc. (a veces todo
 * mayúsculas, a veces sin tildes, a veces con). Usado tanto al ingerir
 * (guardamos también el campo normalizado) como al consultar.
 */
export function normalizar(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos (tildes, diéresis) ya separados por NFD
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Regex que matchea `texto` sin importar tildes/mayúsculas/puntuación en el campo comparado. */
export function regexNormalizado(texto: string): RegExp {
  return new RegExp(normalizar(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}
