import { normalizar } from './normalizar';

/**
 * SECOP usa nombres técnicos/programáticos, no lenguaje coloquial — un
 * ciudadano busca "alimentación" pero el contrato dice "PAE" o "refrigerio
 * escolar". Sin esto, la búsqueda por tema fallaba en silencio (0
 * resultados, no porque no haya datos, sino porque las palabras no
 * coinciden literalmente). No es exhaustivo — cubre los temas más comunes
 * de contratación municipal, se puede ampliar según lo que la gente busque.
 */
const SINONIMOS: Record<string, string[]> = {
  alimentacion: ['pae', 'refrigerio', 'restaurante escolar', 'complemento alimentario', 'alimentacion escolar'],
  educacion: ['colegio', 'institucion educativa', 'docente', 'escolar'],
  salud: ['medicamentos', 'hospital', 'ese', 'ips', 'eps', 'ambulancia'],
  vias: ['pavimentacion', 'carretera', 'malla vial', 'via', 'vial'],
  agua: ['acueducto', 'alcantarillado', 'saneamiento basico', 'potable'],
  deporte: ['recreacion', 'escenario deportivo', 'polideportivo', 'coldeportes'],
  seguridad: ['vigilancia', 'camaras', 'cctv', 'policia', 'convivencia'],
  aseo: ['recoleccion de residuos', 'basuras', 'limpieza publica'],
  tecnologia: ['software', 'plataforma web', 'sistemas de informacion', 'conectividad', 'internet'],
};

/**
 * Palabras normalizadas del tema + sus sinónimos conocidos — para armar un
 * regex OR más generoso al buscar en `textoNormalizado`. Cada palabra del
 * tema original que matchea una clave del diccionario suma sus sinónimos
 * (también troceados en palabras individuales de 3+ letras).
 *
 * Devuelve [] si NINGUNA palabra de `tema` toca el diccionario (ni como
 * clave ni como sinónimo) — sin este guard, una pregunta genérica de
 * análisis ("¿ves patrones preocupantes en la situación general?") arma un
 * regex OR con CUALQUIER palabra de 3+ letras ("general", "situacion",
 * "patrones") y esas palabras aparecen sueltas en textoNormalizado de casi
 * cualquier contrato (ej. "Secretaría General"), secuestrando en falso la
 * respuesta hacia un "filtro de tema" cuando en realidad no hay tema —
 * bloqueando en silencio el camino hacia redactar()/IA. Confirmado con
 * datos reales: "Analiza la situación general..." devolvía 37/750
 * contratos como si "situación general" fuera un tema válido.
 */
export function palabrasConSinonimos(tema: string): string[] {
  const base = normalizar(tema).split(' ').filter((p) => p.length > 2);
  const todosLosTerminosConocidos = new Set(
    Object.entries(SINONIMOS).flatMap(([clave, sinonimos]) => [clave, ...sinonimos.flatMap((s) => normalizar(s).split(' '))]),
  );
  const tocaUnTemaConocido = base.some((p) => todosLosTerminosConocidos.has(p));
  if (!tocaUnTemaConocido) return [];

  const extra: string[] = [];
  for (const palabra of base) {
    const sinonimos = SINONIMOS[palabra];
    if (sinonimos) {
      for (const s of sinonimos) extra.push(...normalizar(s).split(' ').filter((p) => p.length > 2));
    }
  }
  return [...new Set([...base, ...extra])];
}
