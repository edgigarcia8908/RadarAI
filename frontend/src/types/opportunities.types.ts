import type { HomeNavigationTarget } from './home.types';

export type OpportunityIconName = 'monitor' | 'network' | 'server';

export interface OpportunityItem {
  id: string;
  title: string;
  entity: string;
  competition: string;
  recommendation: string;
  /** Todas las razones de compatibilidad que calculó el backend — antes solo se mostraba porQue[0]. */
  porQue: string[];
  modalidad: string;
  fechaPublicacion: string | null;
  precioBase: number;
  urlProceso: string;
  priority: 'Alta posibilidad' | 'Media posibilidad';
  icon: OpportunityIconName;
  tone: 'purple' | 'mustard';
  compatibilidad: number; // 0-100
  competencia: 'BAJA' | 'MEDIA' | 'ALTA';
}

export interface CompanyProfile {
  nombre: string;
  nit?: string;
  productosServicios: string;
  capacidadEconomicaMin?: number;
  capacidadEconomicaMax?: number;
  departamentos: string[];
  ciudades: string[];
  certificaciones: string[];
  regionesOperativas: string[];
}

export interface MatchScoreBreakdown {
  producto: number; // 0-100
  territorio: number; // 0-100
  financiero: number; // 0-100
  experiencia: number; // 0-100
  global: number; // 0-100
}

export interface MarketIntelligence {
  tasaExitoSector: number; // %
  variacionTasa: number; // % vs periodo anterior
  factoresCompetitividad: {
    precioBase: number; // 0-100
    tiemposEjecucion: number; // 0-100
    garantiasLocales: number; // 0-100
  };
  recomendacionEstrategica: string;
}

export interface RequirementCheck {
  criterio: string;
  requisitoBase: string;
  datosEmpresa: string;
  estado: 'CUMPLE' | 'RIESGO' | 'NO_CUMPLE';
}

export interface LicitationDetail {
  id: string;
  nombre: string;
  entidad: string;
  departamento: string;
  ciudad: string;
  modalidad: string;
  fechaPublicacion: string | null;
  precioBase: number;
  urlProceso: string;
  compatibilidad: number;
  competencia: 'BAJA' | 'MEDIA' | 'ALTA';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  porQue: string[];
  requisitos: RequirementCheck[];
}

export interface OpportunitiesViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
  crumbLabel?: string;
  onTerritorioChange?: (departamento: string, municipio: string) => void;
}

export type OpportunitiesStep = 'perfil' | 'busqueda' | 'resultados' | 'detalle';
