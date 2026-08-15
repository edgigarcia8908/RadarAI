import { ContratoInfo } from './contratoUtils';

export interface ConsultaInput {
  departamento?: string;
  ciudad?: string;
  tema: string;
  pregunta: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface Hallazgo {
  tipo: string;
  severidad: 'ALTA' | 'MEDIA';
  titulo: string;
  detalle: string;
  evidencia: { entidad: string; id: string; link?: string }[];
}

export interface ConsultaResultado {
  resumen: {
    territorio: string;
    tema: string;
    valorTotalContratado: number;
    totalProcesos: number;
    totalContratos: number;
    proveedoresUnicos: number;
  };
  hallazgos: Hallazgo[];
  respuesta: string;
  evidenciaContratos: ContratoInfo[];
}

async function manejar(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

export function sincronizar(input: { departamento?: string; ciudad?: string; tema?: string; fechaDesde?: string; fechaHasta?: string }) {
  return fetch('/api/ingestion/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(manejar);
}

export function consultar(input: ConsultaInput): Promise<ConsultaResultado> {
  return fetch('/api/civic-intel/consulta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(manejar);
}

export interface CrearEmpresaInput {
  nombre: string;
  contactoEmail?: string;
  productosServicios: string;
  departamentos?: string[];
  ciudades?: string[];
}

export interface Empresa extends CrearEmpresaInput {
  _id: string;
  palabrasClave: string[];
}

export function crearEmpresa(input: CrearEmpresaInput): Promise<Empresa> {
  return fetch('/api/empresas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(manejar);
}

export interface Oportunidad {
  proceso: {
    idProceso: string;
    entidad: string;
    departamentoEntidad: string;
    ciudadEntidad: string;
    nombreProcedimiento: string;
    descripcionProcedimiento: string;
    precioBase: number;
    fechaPublicacion: string | null;
    modalidadContratacion: string;
    estadoProcedimiento: string;
  };
  compatibilidad: number;
  competencia: 'BAJA' | 'MEDIA' | 'ALTA';
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  porQue: string[];
}

export function oportunidadesParaEmpresa(empresaId: string): Promise<Oportunidad[]> {
  return fetch(`/api/oportunidades/empresa/${empresaId}`).then(manejar);
}

export interface ChecklistItem {
  texto: string;
  hecho: boolean;
}
export interface HallazgoVeeduria {
  titulo: string;
  detalle: string;
  autor: string;
  fecha: string;
}
export interface ComentarioVeeduria {
  autor: string;
  texto: string;
  fecha: string;
}
export interface DocumentoVeeduria {
  storageId: string;
  nombre: string;
  url: string;
  subidoPor: string;
  fecha: string;
  indexado: boolean;
  motivoNoIndexado?: string;
}
export interface Veeduria {
  _id: string;
  titulo: string;
  descripcion: string;
  departamento: string;
  ciudad: string;
  tema: string;
  procesosVinculados: string[];
  contratosVinculados: string[];
  hallazgos: HallazgoVeeduria[];
  comentarios: ComentarioVeeduria[];
  checklist: ChecklistItem[];
  documentos: DocumentoVeeduria[];
  colaboradores: string[];
  estado: 'ABIERTA' | 'CERRADA';
  createdAt: string;
}

export function crearVeeduria(input: {
  titulo: string;
  descripcion?: string;
  departamento?: string;
  ciudad?: string;
  tema?: string;
  procesosVinculados?: string[];
  contratosVinculados?: string[];
}): Promise<Veeduria> {
  return fetch('/api/veedurias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(manejar);
}

export function listarVeedurias(): Promise<Veeduria[]> {
  return fetch('/api/veedurias').then(manejar);
}

export function obtenerVeeduria(id: string): Promise<Veeduria> {
  return fetch(`/api/veedurias/${id}`).then(manejar);
}

export function agregarComentario(id: string, autor: string, texto: string): Promise<Veeduria> {
  return fetch(`/api/veedurias/${id}/comentarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autor, texto }),
  }).then(manejar);
}

export function marcarChecklist(id: string, indice: number, hecho: boolean): Promise<Veeduria> {
  return fetch(`/api/veedurias/${id}/checklist/${indice}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hecho }),
  }).then(manejar);
}

export function subirDocumento(id: string, file: File, subidoPor: string): Promise<Veeduria> {
  const form = new FormData();
  form.append('file', file);
  form.append('subidoPor', subidoPor);
  return fetch(`/api/veedurias/${id}/documentos`, { method: 'POST', body: form }).then(manejar);
}

export interface RespuestaDocumentos {
  answer: string;
  citations: { id: string | number; score: number; file?: string; page?: number }[];
}

export function preguntarSobreDocumentos(id: string, pregunta: string): Promise<RespuestaDocumentos> {
  return fetch(`/api/veedurias/${id}/preguntar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta }),
  }).then(manejar);
}

export interface EvidenciaDetalle {
  procesos: {
    idProceso: string;
    entidad: string;
    nombreProcedimiento: string;
    departamentoEntidad: string;
    ciudadEntidad: string;
    precioBase: number;
  }[];
  contratos: ContratoInfo[];
}

export function obtenerEvidenciaDetalle(id: string): Promise<EvidenciaDetalle> {
  return fetch(`/api/veedurias/${id}/evidencia-detalle`).then(manejar);
}

export interface MunicipioRiesgo {
  departamento: string;
  ciudad: string;
  totalContratos: number;
  valorTotal: number;
  proveedoresUnicos: number;
  concentracionProveedores: number;
}

export function obtenerMapaRiesgo(): Promise<MunicipioRiesgo[]> {
  return fetch('/api/civic-intel/mapa').then(manejar);
}

export interface EstudioMercado {
  totalContratos: number;
  mensaje?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  valorPromedio?: number;
  valorMediana?: number;
  duracionPromedioDias?: number | null;
  proveedoresUnicos?: number;
  proveedoresFrecuentes?: { nombre: string; contratos: number; valorTotal: number }[];
  contratosComparables?: ContratoInfo[];
}

export interface EstadoPresupuestal {
  entidad: string;
  periodoConsultado: string | null;
  presupuestoApropiado: number;
  comprometido: number;
  obligado: number;
  pagado: number;
  porcentajeComprometido: number | null;
  porcentajePagado: number | null;
  valorContratadoSecop: number;
  diferenciaContratadoVsComprometido: number;
  alerta: string | null;
  mensaje?: string;
}

export function obtenerPresupuestoCuipo(input: { departamento?: string; ciudad: string; fechaDesde?: string; fechaHasta?: string }): Promise<EstadoPresupuestal> {
  const params = new URLSearchParams();
  if (input.departamento) params.set('departamento', input.departamento);
  params.set('ciudad', input.ciudad);
  if (input.fechaDesde) params.set('fechaDesde', input.fechaDesde);
  if (input.fechaHasta) params.set('fechaHasta', input.fechaHasta);
  return fetch(`/api/cuipo/presupuesto?${params.toString()}`).then(manejar);
}

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

export function verificarSiri(nombres: string[]): Promise<Record<string, SancionSiri[]>> {
  if (nombres.length === 0) return Promise.resolve({});
  return fetch('/api/siri/verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombres }),
  }).then(manejar);
}

export interface PerfilFuncionario {
  nombre: string;
  totalContratos: number;
  valorTotal?: number;
  municipios: { departamento: string; ciudad: string; contratos: number }[];
  proveedoresFrecuentes: { nombre: string; contratos: number; valorTotal: number; municipios: string[] }[];
  contratos: {
    idContrato: string;
    nombreEntidad: string;
    ciudad: string;
    departamento: string;
    objetoDelContrato: string;
    proveedorAdjudicado: string;
    valorDelContrato: number;
    fechaDeFirma: string | null;
    urlProceso?: string;
  }[];
  alerta: string | null;
}

export function obtenerPerfilFuncionario(nombre: string): Promise<PerfilFuncionario> {
  return fetch(`/api/civic-intel/funcionario?nombre=${encodeURIComponent(nombre)}`).then(manejar);
}

export interface PuestoSensible {
  nombreCompleto: string;
  cargo: string;
  entidad: string;
  dependencia: string;
  nivelJerarquico: string;
  tipoNombramiento: string;
  asignacionBasica: string;
}

export function verificarSigep(nombres: string[]): Promise<Record<string, PuestoSensible[]>> {
  if (nombres.length === 0) return Promise.resolve({});
  return fetch('/api/sigep/verificar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombres }),
  }).then(manejar);
}

export function generarEstudioMercado(input: {
  objeto: string;
  departamento?: string;
  ciudad?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<EstudioMercado> {
  return fetch('/api/estudios-mercado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(manejar);
}
