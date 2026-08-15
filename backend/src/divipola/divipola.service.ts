import { Injectable, Logger } from '@nestjs/common';
import { SocrataClient, soqlString } from '../ingestion/socrata.client';

/**
 * Identidad territorial (Fase 0 de la hoja de ruta) — dataset `pqwj-3fi4`
 * (MinSalud Divipola - Municipios, datos.gov.co), cobertura nacional
 * completa con el código DIVIPOLA oficial (DANE/IGAC) por municipio.
 *
 * Por qué existe: cada fuente que ya integramos escribe el nombre del
 * municipio distinto — SECOP en mayúsculas sin tilde, CUIPO con tilde, SGR
 * en mayúsculas sin tilde. Van 3 bugs de matching encontrados y corregidos
 * por eso mismo. Este servicio es el único lugar donde se resuelve "¿a qué
 * municipio se refiere esto?" contra la llave oficial — el resto de la app
 * debería ir migrando a resolver contra esto en vez de repetir su propia
 * lógica de comparación de texto.
 *
 * Los nombres de departamento NO vienen en el dataset (solo el código) —
 * se usa el mapa oficial DANE de 33 departamentos, estático porque no
 * cambia.
 */
const DATASET_DIVIPOLA_MUNICIPIOS = 'pqwj-3fi4';

export const DEPARTAMENTOS_DIVIPOLA: Record<string, string> = {
  '05': 'Antioquia',
  '08': 'Atlántico',
  '11': 'Bogotá, D.C.',
  '13': 'Bolívar',
  '15': 'Boyacá',
  '17': 'Caldas',
  '18': 'Caquetá',
  '19': 'Cauca',
  '20': 'Cesar',
  '23': 'Córdoba',
  '25': 'Cundinamarca',
  '27': 'Chocó',
  '41': 'Huila',
  '44': 'La Guajira',
  '47': 'Magdalena',
  '50': 'Meta',
  '52': 'Nariño',
  '54': 'Norte de Santander',
  '63': 'Quindío',
  '66': 'Risaralda',
  '68': 'Santander',
  '70': 'Sucre',
  '73': 'Tolima',
  '76': 'Valle del Cauca',
  '81': 'Arauca',
  '85': 'Casanare',
  '86': 'Putumayo',
  '88': 'San Andrés y Providencia',
  '91': 'Amazonas',
  '94': 'Guainía',
  '95': 'Guaviare',
  '97': 'Vaupés',
  '99': 'Vichada',
};

export interface IdentidadMunicipio {
  codigoDivipola: string;
  codigoDepartamento: string;
  nombreMunicipio: string;
  nombreDepartamento: string;
  lat: number | null;
  lng: number | null;
}

@Injectable()
export class DivipolaService {
  private readonly logger = new Logger(DivipolaService.name);
  private readonly cliente = new SocrataClient(DATASET_DIVIPOLA_MUNICIPIOS);

  /**
   * Resuelve un municipio por nombre (+ departamento opcional para
   * desambiguar homónimos, ej. varios "San José" en departamentos
   * distintos). Coincidencia exacta case-insensitive — el dataset SÍ
   * guarda tildes, a diferencia de CUIPO/SGR.
   */
  async resolver(ciudad: string, departamento?: string): Promise<IdentidadMunicipio | null> {
    const ciudadLimpia = ciudad.trim();
    if (!ciudadLimpia) return null;

    let filas: Record<string, any>[];
    try {
      filas = await this.cliente.fetchRows({
        where: [`upper(nommpio) = upper('${soqlString(ciudadLimpia)}')`],
        limit: 10,
      });
    } catch (err) {
      this.logger.warn(`DIVIPOLA no disponible para "${ciudadLimpia}": ${(err as Error).message}`);
      return null;
    }
    if (filas.length === 0) return null;

    let fila = filas[0];
    if (filas.length > 1 && departamento) {
      const codigoBuscado = Object.entries(DEPARTAMENTOS_DIVIPOLA).find(
        ([, nombre]) => nombre.toLowerCase() === departamento.trim().toLowerCase(),
      )?.[0];
      if (codigoBuscado) {
        fila = filas.find((f) => f.iddepto === codigoBuscado) ?? fila;
      }
    }

    return {
      codigoDivipola: fila.idmupio,
      codigoDepartamento: fila.iddepto,
      nombreMunicipio: fila.nommpio,
      nombreDepartamento: DEPARTAMENTOS_DIVIPOLA[fila.iddepto] ?? '',
      lat: fila.mpiolatitud != null ? Number(fila.mpiolatitud) : null,
      lng: fila.mpiolongitud != null ? Number(fila.mpiolongitud) : null,
    };
  }
}
