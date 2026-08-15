export interface ConsultaInput {
  departamento?: string;
  ciudad?: string;
  tema: string;
  pregunta: string;
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

export function sincronizar(input: { departamento?: string; ciudad?: string; tema?: string }) {
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
