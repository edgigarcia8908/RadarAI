import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contrato } from '../ingestion/contrato.schema';
import { Alerta, EstadoAlerta, SeveridadAlerta } from './alertas.schema';

export interface ResultadoCarga {
  procesados: number;
  sinCoincidencia: string[];
  alertas: Alerta[];
}

const ORDEN_SEVERIDAD: Record<SeveridadAlerta, number> = { ALTA: 0, MEDIA: 1, INFO: 2 };

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Versión simple del nombre para coincidencia amplia (sin razones sociales). */
function compararNombre(a: string, b: string): boolean {
  const aN = normalizar(a);
  const bN = normalizar(b);
  if (!aN || !bN) return false;
  if (aN === bN) return true;
  const corta = (s: string) => s.replace(/\b(s\.?a\.?s?|s\.?a\.?|e\.?u\.?|ltda|limitada|sas|sa|en sociedad|inglesa|ltda\.)\b/g, '');
  return corta(aN) === corta(bN);
}

@Injectable()
export class AlertasService {
  constructor(
    @InjectModel(Alerta.name) private readonly alertaModel: Model<Alerta>,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
  ) {}

  /**
   * Parsea el CSV (proveedor o nombre de empresa, sin NIT — justo el caso
   * del ciudadano que nombra a "quien le debe") y genera alertas
   * contrastándolo con SECOP.
   */
  async cargarCsv(texto: string, fuenteArchivo: string): Promise<ResultadoCarga> {
    const nombres = this.extraerNombres(texto);
    const sinCoincidencia: string[] = [];
    const alertas: Alerta[] = [];

    for (const nombre of nombres) {
      const contratos = await this.buscarContratos(nombre);
      const alerta = await this.generarAlerta(nombre, contratos, fuenteArchivo);
      alertas.push(alerta);
      if (contratos.length === 0) sinCoincidencia.push(nombre);
    }

    const guardadas = await this.alertaModel.insertMany(alertas, { ordered: false }).catch(() => []);
    return { procesados: nombres.length, sinCoincidencia, alertas: guardadas.length ? guardadas : alertas };
  }

  listar(estado?: EstadoAlerta): Promise<Alerta[]> {
    const filtro = estado ? { estado } : {};
    return this.alertaModel.find(filtro).sort({ createdAt: -1 }).limit(300).exec();
  }

  async marcarRevisada(id: string): Promise<Alerta | null> {
    return this.alertaModel.findByIdAndUpdate(id, { estado: 'REVISADA' }, { new: true }).exec();
  }

  private extraerNombres(texto: string): string[] {
    const lineas = texto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const sinHeader = lineas.filter((l) => !/proveedor|nombre|empresa|nit/i.test(l.split(',')[0]));
    const nombres = sinHeader.map((linea) => {
      const col = linea.split(',')[0];
      return col.replace(/^["']|["']$/g, '').trim();
    });

    return [...new Set(nombres.filter((n) => n.length > 2))].slice(0, 200);
  }

  private async buscarContratos(nombre: string): Promise<{ doc: Contrato; sobrecosto: boolean; montoSobrecosto: number }[]> {
    const docs = await this.contratoModel
      .find({ proveedorAdjudicado: { $regex: escaparRegex(nombre), $options: 'i' } })
      .limit(200);
    const coincidentes = docs.filter((d) => compararNombre(d.proveedorAdjudicado, nombre));
    return coincidentes.map((doc) => {
      const sobrecosto = doc.valorPagado > doc.valorDelContrato;
      return { doc, sobrecosto, montoSobrecosto: sobrecosto ? doc.valorPagado - doc.valorDelContrato : 0 };
    });
  }

  private async generarAlerta(
    nombre: string,
    contratos: { doc: Contrato; sobrecosto: boolean; montoSobrecosto: number }[],
    fuenteArchivo: string,
  ): Promise<Alerta> {
    const motivos: { severidad: SeveridadAlerta; motivo: string }[] = [];

    if (contratos.length === 0) {
      motivos.push({ severidad: 'INFO', motivo: 'Sin registros en SECOP para este proveedor' });
    }
    if (contratos.length >= 5) motivos.push({ severidad: 'ALTA', motivo: `Proveedor recurrente: ${contratos.length} contratos adjudicados` });
    else if (contratos.length >= 3) motivos.push({ severidad: 'MEDIA', motivo: `Apariciones repetidas: ${contratos.length} contratos adjudicados` });

    const conSobrecosto = contratos.filter((c) => c.sobrecosto);
    if (conSobrecosto.length > 0) {
      const total = conSobrecosto.reduce((s, c) => s + c.montoSobrecosto, 0);
      motivos.push({ severidad: 'ALTA', motivo: `Sobrecosto detectado en ${conSobrecosto.length} contrato(s): ${total.toLocaleString('es-CO')} COP` });
    }

    const valorTotal = contratos.reduce((s, c) => s + c.doc.valorDelContrato, 0);
    if (valorTotal > 5_000_000_000) motivos.push({ severidad: 'ALTA', motivo: 'Concentración de valor: suma de contratos por encima de 5.000M COP' });
    else if (valorTotal > 1_000_000_000) motivos.push({ severidad: 'MEDIA', motivo: 'Suma de contratos por encima de 1.000M COP' });

    motivos.sort((a, b) => ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad]);
    const principal = motivos[0] ?? { severidad: 'INFO' as SeveridadAlerta, motivo: 'Sin hallazgos relevantes' };
    const nit = contratos.find((c) => c.doc.nitProveedor)?.doc.nitProveedor ?? '';

    const alerta = new this.alertaModel({
      proveedor: nombre,
      nitProveedor: nit,
      contratos: contratos.length,
      valorTotal,
      sobrecostoTotal: conSobrecosto.reduce((s, c) => s + c.montoSobrecosto, 0),
      motivo: principal.motivo,
      severidad: principal.severidad,
      estado: 'ABIERTA',
      fuenteArchivo,
    });
    return alerta;
  }
}