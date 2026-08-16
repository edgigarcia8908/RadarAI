import type { HomeResponsePresentation } from './home.types';

export interface ChatRequest {
  mensaje: string;
  departamento?: string;
  ciudad?: string;
  periodo?: string;
}

export interface ChatResponse {
  respuesta: string;
  requiereTerritorio?: boolean;
  presentacion?: HomeResponsePresentation;
}
