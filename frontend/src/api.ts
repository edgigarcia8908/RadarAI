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
  evidenciaContratos: any[];
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
  colaboradores: string[];
  estado: 'ABIERTA' | 'CERRADA';
  createdAt: string;
}

export function crearVeeduria(input: { titulo: string; descripcion?: string; departamento?: string; ciudad?: string; tema?: string }): Promise<Veeduria> {
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
