import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Espejo normalizado de un registro del dataset Socrata "SECOP II - Contratos
 * Electrónicos" (datos.gov.co, id `jbjy-vk9h`). `urlProceso` es el único
 * puente hacia la plataforma SECOP II real — apunta a
 * community.secop.gov.co, que está protegida con ReCaptcha y no expone una
 * API pública de documentos. Por eso NO scrapeamos esa URL: la guardamos
 * como link de "ver proceso original" para que el ciudadano/empresa pueda
 * verificar la fuente primaria, y la evidencia de RadarAI se arma con los
 * campos de texto que sí son de datos abiertos (`objetoDelContrato`,
 * `descripcionDelProceso`).
 */
@Schema({ timestamps: true })
export class Contrato extends Document {
  @Prop({ type: String, required: true, unique: true, index: true }) idContrato: string;
  @Prop({ type: String, default: '' }) referenciaContrato: string;
  @Prop({ type: String, default: '', index: true }) procesoDeCompra: string;
  @Prop({ type: String, default: '' }) urlProceso: string;

  @Prop({ type: String, required: true, index: true }) nombreEntidad: string;
  @Prop({ type: String, default: '' }) nitEntidad: string;
  @Prop({ type: String, default: '', index: true }) departamento: string;
  @Prop({ type: String, default: '', index: true }) ciudad: string;
  /** Sin tildes/mayúsculas/puntuación — para filtrar sin que importe cómo lo escribió cada entidad. */
  @Prop({ type: String, default: '', index: true }) departamentoNormalizado: string;
  @Prop({ type: String, default: '', index: true }) ciudadNormalizado: string;

  @Prop({ type: String, default: '' }) estadoContrato: string;
  @Prop({ type: String, default: '' }) tipoDeContrato: string;
  @Prop({ type: Date, default: null }) fechaDeFirma: Date | null;
  @Prop({ type: Date, default: null }) fechaDeInicio: Date | null;
  @Prop({ type: Date, default: null }) fechaDeFin: Date | null;

  @Prop({ type: String, default: '' }) objetoDelContrato: string;
  @Prop({ type: String, default: '' }) descripcionDelProceso: string;
  @Prop({ type: String, default: '' }) textoNormalizado: string;

  @Prop({ type: String, default: '', index: true }) proveedorAdjudicado: string;
  @Prop({ type: String, default: '', index: true }) nitProveedor: string;

  @Prop({ type: Number, default: 0 }) valorDelContrato: number;
  @Prop({ type: Number, default: 0 }) valorPagado: number;

  @Prop({ type: Object, default: {} }) crudo: Record<string, unknown>;
}

export const ContratoSchema = SchemaFactory.createForClass(Contrato);
ContratoSchema.index({ objetoDelContrato: 'text', descripcionDelProceso: 'text' });
