export interface ChatRequest {
  mensaje: string;
  departamento?: string;
  ciudad?: string;
  periodo?: string;
}

export interface ChatResponse {
  respuesta: string;
  requiereTerritorio?: boolean;
}
