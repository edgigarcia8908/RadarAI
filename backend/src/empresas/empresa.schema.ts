import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Empresa extends Document {
  @Prop({ type: String, required: true }) nombre: string;
  @Prop({ type: String, default: '' }) nit: string;
  @Prop({ type: String, default: '' }) contactoEmail: string;

  /** Texto libre tal como lo escribió el usuario — "Vendemos computadores, servidores y soporte técnico". */
  @Prop({ type: String, required: true }) productosServicios: string;
  /** Generado de `productosServicios` (ver `extraerPalabrasClave`) — el "perfil semántico" simplificado. */
  @Prop({ type: [String], default: [] }) palabrasClave: string[];

  /** Departamentos donde la empresa quiere operar. Vacío = sin restricción territorial. */
  @Prop({ type: [String], default: [] }) departamentos: string[];
  @Prop({ type: [String], default: [] }) ciudades: string[];

  @Prop({ type: Number, default: 0 }) capacidadEconomicaMin: number;
  @Prop({ type: Number, default: 0 }) capacidadEconomicaMax: number;

  @Prop({ type: String, default: null }) propietarioUserId: string | null;
  @Prop({ type: Boolean, default: true }) activo: boolean;
}

export const EmpresaSchema = SchemaFactory.createForClass(Empresa);
