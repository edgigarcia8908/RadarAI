import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Espejo normalizado de un registro del dataset Socrata "SECOP II - Procesos
 * de Contratación" (datos.gov.co, id `p6dx-8zbt`). Trae `urlproceso` (como
 * objeto `{url: "..."}`, igual que en el dataset de Contratos) para enlazar
 * directo a la página pública del proceso en SECOP. También trae
 * `codigoCategoriaUnspsc` (qué se compró, a nivel de categoría) y el
 * proveedor adjudicado, suficiente para el AI Engine de Fase 1.
 */
@Schema({ timestamps: true })
export class Proceso extends Document {
  @Prop({ type: String, required: true, unique: true, index: true }) idProceso: string;
  @Prop({ type: String, default: '' }) referenciaProceso: string;
  @Prop({ type: String, default: '' }) urlProceso: string;

  @Prop({ type: String, required: true, index: true }) entidad: string;
  @Prop({ type: String, default: '' }) nitEntidad: string;
  @Prop({ type: String, default: '', index: true }) departamentoEntidad: string;
  @Prop({ type: String, default: '', index: true }) ciudadEntidad: string;
  /** Sin tildes/mayúsculas/puntuación — para filtrar sin que importe cómo lo escribió cada entidad. */
  @Prop({ type: String, default: '', index: true }) departamentoEntidadNormalizado: string;
  @Prop({ type: String, default: '', index: true }) ciudadEntidadNormalizado: string;

  @Prop({ type: String, default: '' }) nombreProcedimiento: string;
  @Prop({ type: String, default: '' }) descripcionProcedimiento: string;
  @Prop({ type: String, default: '' }) textoNormalizado: string;
  @Prop({ type: String, default: '' }) modalidadContratacion: string;
  @Prop({ type: String, default: '' }) codigoCategoriaUnspsc: string;

  @Prop({ type: Number, default: 0 }) precioBase: number;
  @Prop({ type: Date, default: null }) fechaPublicacion: Date | null;
  /**
   * OJO: NO es lo mismo que `estadoApertura`. `estadoProcedimiento` es el
   * paso del flujo interno de SECOP (Borrador/Publicado/Seleccionado/
   * Evaluación/Aprobado/Cancelado) — "Seleccionado" acá NO significa
   * "proveedor ya elegido", es el nombre de una fase administrativa (fuente
   * de confusión real, verificado a mano: 1015 de 1093 procesos
   * "Seleccionado" en Cundinamarca siguen con `estadoApertura = 'Abierto'`
   * y `adjudicado = false`).
   */
  @Prop({ type: String, default: '' }) estadoProcedimiento: string;
  /** Señal real de si SECOP todavía acepta algo en este proceso — 'Abierto' | 'Cerrado'. Este es el campo que importa para "¿es una oportunidad real?". */
  @Prop({ type: String, default: '', index: true }) estadoApertura: string;
  @Prop({ type: String, default: '' }) fase: string;

  @Prop({ type: Boolean, default: false }) adjudicado: boolean;
  @Prop({ type: Number, default: 0 }) valorTotalAdjudicacion: number;
  @Prop({ type: Date, default: null }) fechaAdjudicacion: Date | null;
  @Prop({ type: String, default: '' }) nombreProveedorAdjudicado: string;
  @Prop({ type: String, default: '', index: true }) nitProveedorAdjudicado: string;

  /** JSON crudo tal como vino de Socrata, por si hace falta un campo que no normalizamos. */
  @Prop({ type: Object, default: {} }) crudo: Record<string, unknown>;
}

export const ProcesoSchema = SchemaFactory.createForClass(Proceso);
ProcesoSchema.index({ nombreProcedimiento: 'text', descripcionProcedimiento: 'text' });
