import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const EstadoVeeduria = { ABIERTA: 'ABIERTA', CERRADA: 'CERRADA' } as const;

export interface Hallazgo {
  titulo: string;
  detalle: string;
  autor: string;
  fecha: Date;
}

export interface Comentario {
  autor: string;
  texto: string;
  fecha: Date;
}

export interface ChecklistItem {
  texto: string;
  hecho: boolean;
}

/** Checklist por defecto — mismo que sugiere el documento de producto de RADAR. */
export const CHECKLIST_DEFAULT: ChecklistItem[] = [
  { texto: 'Revisar contrato', hecho: false },
  { texto: 'Revisar estudios previos', hecho: false },
  { texto: 'Comparar valor con procesos similares', hecho: false },
  { texto: 'Revisar modificaciones', hecho: false },
  { texto: 'Revisar ejecución', hecho: false },
  { texto: 'Verificar proveedor', hecho: false },
];

@Schema({ timestamps: true })
export class Veeduria extends Document {
  @Prop({ type: String, required: true }) titulo: string;
  @Prop({ type: String, default: '' }) descripcion: string;

  @Prop({ type: String, default: '' }) departamento: string;
  @Prop({ type: String, default: '' }) ciudad: string;
  @Prop({ type: String, default: '' }) tema: string;

  /** ids de `Proceso.idProceso` / `Contrato.idContrato` que esta veeduría está investigando — evidencia real, no texto suelto. */
  @Prop({ type: [String], default: [] }) procesosVinculados: string[];
  @Prop({ type: [String], default: [] }) contratosVinculados: string[];

  @Prop({ type: [Object], default: [] }) hallazgos: Hallazgo[];
  @Prop({ type: [Object], default: [] }) comentarios: Comentario[];
  @Prop({ type: [Object], default: () => CHECKLIST_DEFAULT.map((c) => ({ ...c })) }) checklist: ChecklistItem[];

  /** Emails/nombres de quienes colaboran — Fase 1: sin cuentas reales vinculadas (ver README, auth no aplicado todavía). */
  @Prop({ type: [String], default: [] }) colaboradores: string[];

  @Prop({ type: String, default: null }) creadaPorUserId: string | null;
  @Prop({ type: String, enum: Object.values(EstadoVeeduria), default: EstadoVeeduria.ABIERTA }) estado: string;
}

export const VeeduriaSchema = SchemaFactory.createForClass(Veeduria);
