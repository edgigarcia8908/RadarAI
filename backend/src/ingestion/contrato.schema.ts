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
  /** UNSPSC del contrato (campo `codigo_de_categoria_principal` en Socrata) — permite competencia histórica real por categoría, no solo por territorio. */
  @Prop({ type: String, default: '', index: true }) codigoCategoriaUnspsc: string;

  @Prop({ type: String, default: '', index: true }) proveedorAdjudicado: string;
  @Prop({ type: String, default: '', index: true }) nitProveedor: string;

  /** Quién firmó por el proveedor — campo pedido por retroalimentación: "quién firmó" para que un ciudadano común lo entienda de un vistazo. */
  @Prop({ type: String, default: '' }) nombreRepresentanteLegal: string;
  /** Quién autorizó el gasto por la entidad. */
  @Prop({ type: String, default: '' }) nombreOrdenadorDelGasto: string;
  /** Quién supervisa la ejecución por la entidad. */
  @Prop({ type: String, default: '' }) nombreSupervisor: string;

  @Prop({ type: Number, default: 0 }) valorDelContrato: number;
  @Prop({ type: Number, default: 0 }) valorPagado: number;
  /** `valor_pendiente_de_pago` — lo que falta pagar según SECOP, más preciso que restar valorPagado (puede haber facturado sin pagar todavía). */
  @Prop({ type: Number, default: 0 }) valorPendientePago: number;

  /**
   * `liquidaci_n` (Sí/No de SECOP) — señal REAL de si el contrato ya se
   * liquidó, no una aproximación por `estadoContrato` (ver README: se
   * había documentado que SECOP "no tiene un estado literal liquidado" —
   * error, sí lo tiene, en este campo separado, descubierto después).
   */
  @Prop({ type: Boolean, default: false }) liquidado: boolean;
  /**
   * `dias_adicionados` — días de prórroga sumados al contrato. Es
   * literalmente la señal de "modificaciones posteriores a la
   * adjudicación" que se había documentado como no disponible en SECOP —
   * sí está, en este campo.
   */
  @Prop({ type: Number, default: 0 }) diasAdicionados: number;
  @Prop({ type: Boolean, default: false }) puedeSerProrrogado: boolean;

  /** "Inversión" o "Funcionamiento" — para qué se gastó la plata. */
  @Prop({ type: String, default: '' }) destinoGasto: string;
  /** "Recursos propios", "Sistema General de Regalías", crédito, etc. — de dónde salió la plata (relevante para veeduría: regalías mal usadas es un vector clásico). */
  @Prop({ type: String, default: '' }) origenDeLosRecursos: string;
  /** Dirección física donde se ejecuta el contrato — útil para georreferenciar obras puntuales (no todos los contratos la traen). */
  @Prop({ type: String, default: '' }) direccionEjecucion: string;
  /** Quién autoriza el pago (distinto del ordenador del gasto que autoriza el contrato). */
  @Prop({ type: String, default: '' }) nombreOrdenadorDePago: string;

  @Prop({ type: Object, default: {} }) crudo: Record<string, unknown>;
}

export const ContratoSchema = SchemaFactory.createForClass(Contrato);
ContratoSchema.index({ objetoDelContrato: 'text', descripcionDelProceso: 'text' });
