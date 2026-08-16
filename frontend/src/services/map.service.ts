import { obtenerMapaRiesgo } from '../api';
import type { MunicipioRiesgo } from '../api';

export function obtenerDatosMapa(): Promise<MunicipioRiesgo[]> {
  return obtenerMapaRiesgo().then((data) => (Array.isArray(data) ? data : []));
}
