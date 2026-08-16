import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SeveridadAlerta = 'ALTA' | 'MEDIA' | 'INFO';
export type EstadoAlerta = 'ABIERTA' | 'REVISADA';

/**
 * Alerta generada a partir de una carga masiva CSV de proveedores
 * (denuncias/contraloría ciudadana) contrastada contra SECOP:
 * se cruza el nombre del proveedor con los contratos adjudicados y se
 * aplican reglas simples (recurrencia, sobrecosto, concentración de valor)
 * para priorizar dónde mirar.
 */
@Schema({ timestamps: true })
export class Alerta extends Document {
  /** Nombre del proveedor tal como vino en el CSV. */
  @Prop({ type: String, required: true, index: true }) proveedor: string;
  /** NIT encontrado en SECOP si hubo coincidencia exacta de nombre. */
  @Prop({ type: String, default: '' }) nitProveedor: string;
  /** Número de contratos adjudicados en SECOP. */
  @Prop({ type: Number, default: 0 }) contratos: number;
  @Prop({ type: Number, default: 0 }) valorTotal: number;
  @Prop({ type: Number, default: 0 }) sobrecostoTotal: number;
  /** Por qué saltó la alerta (regla disparada, la más severa). */
  @Prop({ type: String, default: '' }) motivo: string;
  @Prop({ type: String, enum: ['ALTA', 'MEDIA', 'INFO'], default: 'INFO' }) severidad: SeveridadAlerta;
  @Prop({ type: String, enum: ['ABIERTA', 'REVISADA'], default: 'ABIERTA' }) estado: EstadoAlerta;
  /** Nombre del archivo CSV del que salió. */
  @Prop({ type: String, default: '' }) fuenteArchivo: string;
}

export const AlertaSchema = SchemaFactory.createForClass(Alerta);