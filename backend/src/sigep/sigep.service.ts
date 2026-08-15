import { Injectable, Logger } from '@nestjs/common';
import { SocrataClient } from '../ingestion/socrata.client';
import { normalizar } from '../common/normalizar';

/**
 * SIGEP II — "Puestos Sensibles a la Corrupción" (dataset `5u9e-g5w9`,
 * datos.gov.co): listado de servidores públicos activos que ejercen cargos
 * de confianza (libre nombramiento y remoción, alto nivel jerárquico,
 * etc.) — categoría que la Función Pública considera de mayor exposición a
 * riesgo de corrupción, NO una acusación de nada.
 *
 * Mismo cuidado que SIRI: el cruce es por NOMBRE, no por cédula (SECOP no
 * la trae), así que un nombre común puede coincidir con una persona
 * distinta. Nunca se afirma identidad — solo "coincidencia de nombre a
 * verificar". A diferencia de SIRI esto no es una sanción, es contexto
 * (cargo, entidad, salario asignado — todos datos públicos por ley en
 * SIGEP), pero el riesgo de atribuirle el cargo/salario de otra persona a
 * alguien por error sigue siendo real, así que se aplica el mismo umbral
 * de coincidencia fuerte.
 */
const DATASET_PUESTOS_SENSIBLES = '5u9e-g5w9';

export interface PuestoSensible {
  nombreCompleto: string;
  cargo: string;
  entidad: string;
  dependencia: string;
  nivelJerarquico: string;
  tipoNombramiento: string;
  asignacionBasica: string;
}

function tokens(texto: string): Set<string> {
  return new Set(normalizar(texto).split(' ').filter((t) => t.length >= 3));
}

@Injectable()
export class SigepService {
  private readonly logger = new Logger(SigepService.name);
  private readonly cliente = new SocrataClient(DATASET_PUESTOS_SENSIBLES);

  private async buscarUno(nombre: string): Promise<PuestoSensible[]> {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 6) return [];
    const tokensBuscados = tokens(nombreLimpio);
    if (tokensBuscados.size < 2) return [];

    let filas: Record<string, any>[];
    try {
      filas = await this.cliente.fetchRows({ q: nombreLimpio, limit: 10 });
    } catch (err) {
      this.logger.warn(`SIGEP (puestos sensibles) no disponible para "${nombreLimpio}": ${(err as Error).message}`);
      return [];
    }

    const coincidencias: PuestoSensible[] = [];
    for (const fila of filas) {
      const nombreCompleto = fila.nombre_completo || '';
      const tokensFila = tokens(nombreCompleto);
      const compartidos = [...tokensBuscados].filter((t) => tokensFila.has(t)).length;
      if (compartidos < 3) continue;

      coincidencias.push({
        nombreCompleto,
        cargo: fila.denominacion_empleo_actual || '',
        entidad: fila.nombre_institucion || '',
        dependencia: fila.dependencia_empleo_actual || '',
        nivelJerarquico: fila.nivel_jerarquico_empleo || '',
        tipoNombramiento: fila.tipo_nombramiento || '',
        asignacionBasica: fila.asig_basica || '',
      });
    }
    return coincidencias;
  }

  async buscarVarios(nombres: string[]): Promise<Record<string, PuestoSensible[]>> {
    const unicos = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))];
    const resultados = await Promise.all(unicos.map((n) => this.buscarUno(n)));
    const mapa: Record<string, PuestoSensible[]> = {};
    unicos.forEach((n, i) => {
      if (resultados[i].length) mapa[n] = resultados[i];
    });
    return mapa;
  }
}
