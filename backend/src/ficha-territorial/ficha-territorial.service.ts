import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';
import { DivipolaService, IdentidadMunicipio } from '../divipola/divipola.service';
import { TerritorioService } from '../territorio/territorio.service';
import { CuipoService, EstadoPresupuestal } from '../cuipo/cuipo.service';
import { SiriService } from '../siri/siri.service';
import { SigepService } from '../sigep/sigep.service';
import { normalizar } from '../common/normalizar';
import { departamentoRealSecop } from '../common/departamento-secop';

export interface ResumenContratacion {
  totalContratos: number;
  valorTotal: number;
  proveedoresUnicos: number;
  concentracionProveedores: number;
}

export interface AlertasIdentidad {
  nombresRevisados: number;
  totalNombresDistintos: number;
  coincidenciasSiri: number;
  coincidenciasSigep: number;
}

export interface FichaTerritorial {
  identidad: IdentidadMunicipio | null;
  contratacion: ResumenContratacion;
  presupuesto: EstadoPresupuestal;
  desempenoMunicipal: { anio: string | null; puntaje: number | null };
  proyectosRegalias: Awaited<ReturnType<TerritorioService['proyectosRegalias']>>;
  alertaRegalias: string | null;
  alertasIdentidad: AlertasIdentidad;
}

/**
 * Fase 0 de la hoja de ruta: consolida en UNA vista lo que hoy vive
 * repartido entre Vigilar mi territorio, Estudio de mercado y Mapa de
 * riesgo — reusando los servicios ya construidos (nada de fuentes
 * nuevas). El único componente nuevo es la resolución de identidad
 * (DivipolaService).
 */
@Injectable()
export class FichaTerritorialService {
  constructor(
    @Inject(DivipolaService) private readonly divipola: DivipolaService,
    @Inject(TerritorioService) private readonly territorio: TerritorioService,
    @Inject(CuipoService) private readonly cuipo: CuipoService,
    @Inject(SiriService) private readonly siri: SiriService,
    @Inject(SigepService) private readonly sigep: SigepService,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
  ) {}

  private async resumenContratacion(departamento: string | undefined, ciudad: string): Promise<{ resumen: ResumenContratacion; contratos: Contrato[] }> {
    const departamentoReal = departamentoRealSecop(departamento, ciudad);
    const filtro: Record<string, unknown> = { ciudadNormalizado: normalizar(ciudad) };
    if (departamentoReal) filtro.departamentoNormalizado = normalizar(departamentoReal);

    const contratos = await this.contratoModel.find(filtro).lean<Contrato[]>();
    const valorTotal = contratos.reduce((s, c) => s + (c.valorDelContrato || 0), 0);
    const porProveedor = new Map<string, number>();
    for (const c of contratos) {
      const key = c.nitProveedor || c.proveedorAdjudicado;
      if (!key) continue;
      porProveedor.set(key, (porProveedor.get(key) || 0) + (c.valorDelContrato || 0));
    }
    const top2 = [...porProveedor.values()].sort((a, b) => b - a).slice(0, 2).reduce((s, v) => s + v, 0);
    const concentracion = valorTotal > 0 ? Math.round((top2 / valorTotal) * 100) : 0;

    return {
      resumen: { totalContratos: contratos.length, valorTotal, proveedoresUnicos: porProveedor.size, concentracionProveedores: concentracion },
      contratos,
    };
  }

  async ficha(departamento: string | undefined, ciudad: string): Promise<FichaTerritorial> {
    const hoy = new Date();
    const haceUnAno = new Date(hoy);
    haceUnAno.setFullYear(hoy.getFullYear() - 1);
    const fechaDesde = haceUnAno.toISOString().slice(0, 10);
    const fechaHasta = hoy.toISOString().slice(0, 10);

    const [identidad, { resumen: contratacion, contratos }, presupuesto, contextoTerritorial] = await Promise.all([
      this.divipola.resolver(ciudad, departamento).catch(() => null),
      this.resumenContratacion(departamento, ciudad),
      this.cuipo.obtenerPresupuesto({ departamento, ciudad, fechaDesde, fechaHasta }),
      this.territorio.contexto(ciudad),
    ]);

    // Tope duro: un municipio con mucho histórico sincronizado puede tener
    // cientos de nombres distintos, y SIRI/SIGEP no tienen endpoint "IN" —
    // es una consulta por nombre. Sin tope, esto dispara cientos de fetch
    // en paralelo y satura la conexión (verificado: 517 nombres reales
    // hicieron fallar TODAS las consultas por agotamiento de conexiones).
    // La ficha es un resumen, no necesita ser exhaustiva — el detalle
    // completo con disclaimer sigue disponible por contrato en Vigilar mi
    // territorio.
    const TOPE_NOMBRES_IDENTIDAD = 40;
    const todosLosNombres = [
      ...new Set(
        contratos
          .flatMap((c) => [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto, c.nombreSupervisor])
          .filter((n): n is string => !!n),
      ),
    ];
    const nombres = todosLosNombres.slice(0, TOPE_NOMBRES_IDENTIDAD);
    const [siriResultado, sigepResultado] = await Promise.all([
      this.siri.buscarVarios(nombres).catch(() => ({})),
      this.sigep.buscarVarios(nombres).catch(() => ({})),
    ]);

    return {
      identidad,
      contratacion,
      presupuesto,
      desempenoMunicipal: contextoTerritorial.desempenoMunicipal,
      proyectosRegalias: contextoTerritorial.proyectosRegalias,
      alertaRegalias: contextoTerritorial.alerta,
      alertasIdentidad: {
        nombresRevisados: nombres.length,
        totalNombresDistintos: todosLosNombres.length,
        coincidenciasSiri: Object.keys(siriResultado).length,
        coincidenciasSigep: Object.keys(sigepResultado).length,
      },
    };
  }
}
