import { Injectable, Logger } from '@nestjs/common';
import { SocrataClient } from '../ingestion/socrata.client';
import { normalizar } from '../common/normalizar';

/**
 * SIRI (Sistema de Información de Registro de Sanciones e Inhabilidades) —
 * dataset `iaeu-rcn6` en datos.gov.co, alimenta también el Portal
 * Anticorrupción de Colombia (PACO). Trae sanciones disciplinarias
 * certificables contra servidores/ex servidores/particulares con función
 * pública.
 *
 * IMPORTANTE — riesgo de difamación: SIRI no trae cédula en el mismo campo
 * que buscamos (los contratos de SECOP solo traen el NOMBRE del firmante,
 * no su número de identificación), así que el cruce es por NOMBRE, no por
 * identidad verificada. Un nombre común puede coincidir con una persona
 * sancionada distinta a la que firmó el contrato. Por eso todo lo que
 * devuelve este servicio se etiqueta explícitamente como "coincidencia de
 * nombre, no de identidad" — nunca se afirma que la persona SEA la
 * sancionada.
 */
const DATASET_SIRI = 'iaeu-rcn6';

export interface SancionSiri {
  nombreCompleto: string;
  cargo: string;
  sanciones: string;
  tipoInhabilidad: string;
  autoridad: string;
  fechaEfectosJuridicos: string;
  entidadSancionado: string;
  numeroProceso: string;
}

function tokens(texto: string): Set<string> {
  return new Set(normalizar(texto).split(' ').filter((t) => t.length >= 3));
}

@Injectable()
export class SiriService {
  private readonly logger = new Logger(SiriService.name);
  private readonly cliente = new SocrataClient(DATASET_SIRI);

  /**
   * Busca coincidencias de nombre para UNA persona. Solo se considera
   * "coincidencia fuerte" si al menos 3 tokens del nombre buscado (de 4+
   * caracteres, sin tildes) aparecen en el nombre completo del registro
   * SIRI — evita falsos positivos por un solo apellido común.
   */
  private async buscarUno(nombre: string): Promise<SancionSiri[]> {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 6) return [];
    const tokensBuscados = tokens(nombreLimpio);
    if (tokensBuscados.size < 2) return [];

    let filas: Record<string, any>[];
    try {
      filas = await this.cliente.fetchRows({ q: nombreLimpio, limit: 10 });
    } catch (err) {
      this.logger.warn(`SIRI no disponible para "${nombreLimpio}": ${(err as Error).message}`);
      return [];
    }

    const coincidencias: SancionSiri[] = [];
    for (const fila of filas) {
      const nombreCompleto = [fila.primer_nombre, fila.segundo_nombre, fila.primer_apellido, fila.segundo_apellido]
        .filter(Boolean)
        .join(' ');
      const tokensFila = tokens(nombreCompleto);
      const compartidos = [...tokensBuscados].filter((t) => tokensFila.has(t)).length;
      if (compartidos < 3) continue; // coincidencia débil (ej. solo un apellido común) — se descarta

      coincidencias.push({
        nombreCompleto,
        cargo: fila.cargo || '',
        sanciones: fila.sanciones || '',
        tipoInhabilidad: fila.tipo_inhabilidad || '',
        autoridad: fila.autoridad || '',
        fechaEfectosJuridicos: fila.fecha_efectos_juridicos || '',
        entidadSancionado: fila.entidad_sancionado || '',
        numeroProceso: fila.numero_proceso || '',
      });
    }
    return coincidencias;
  }

  /** Batch: un nombre por vez contra Socrata (no hay endpoint de "IN" de texto), pero en paralelo. */
  async buscarVarios(nombres: string[]): Promise<Record<string, SancionSiri[]>> {
    const unicos = [...new Set(nombres.map((n) => n.trim()).filter(Boolean))];
    const resultados = await Promise.all(unicos.map((n) => this.buscarUno(n)));
    const mapa: Record<string, SancionSiri[]> = {};
    unicos.forEach((n, i) => {
      if (resultados[i].length) mapa[n] = resultados[i];
    });
    return mapa;
  }
}
