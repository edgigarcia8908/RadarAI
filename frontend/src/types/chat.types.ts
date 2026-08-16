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
  /** El territorio que realmente se usó para responder — puede diferir del que mandó el selector si el mensaje nombraba otro municipio ("¿y en Zipaquirá?"). El frontend sincroniza el selector con esto. */
  territorioUsado?: { departamento: string; ciudad: string };
}
