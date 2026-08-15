import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Veeduria, Comentario, Hallazgo } from './veeduria.schema';

export interface CrearVeeduriaInput {
  titulo: string;
  descripcion?: string;
  departamento?: string;
  ciudad?: string;
  tema?: string;
  procesosVinculados?: string[];
  contratosVinculados?: string[];
}

@Injectable()
export class VeeduriasService {
  constructor(@InjectModel(Veeduria.name) private readonly model: Model<Veeduria>) {}

  crear(data: CrearVeeduriaInput) {
    return this.model.create(data);
  }

  listar(filtro: { departamento?: string; ciudad?: string } = {}) {
    const query: Record<string, unknown> = {};
    if (filtro.departamento) query.departamento = filtro.departamento;
    if (filtro.ciudad) query.ciudad = filtro.ciudad;
    return this.model.find(query).sort({ createdAt: -1 });
  }

  async obtener(id: string) {
    const v = await this.model.findById(id);
    if (!v) throw new NotFoundException('Veeduría no encontrada');
    return v;
  }

  async agregarHallazgo(id: string, hallazgo: Omit<Hallazgo, 'fecha'>) {
    const v = await this.obtener(id);
    v.hallazgos.push({ ...hallazgo, fecha: new Date() });
    return v.save();
  }

  async agregarComentario(id: string, comentario: Omit<Comentario, 'fecha'>) {
    const v = await this.obtener(id);
    v.comentarios.push({ ...comentario, fecha: new Date() });
    return v.save();
  }

  async marcarChecklist(id: string, indice: number, hecho: boolean) {
    const v = await this.obtener(id);
    if (!v.checklist[indice]) throw new NotFoundException('Item de checklist no encontrado');
    v.checklist[indice].hecho = hecho;
    v.markModified('checklist');
    return v.save();
  }

  async vincularEvidencia(id: string, data: { procesoId?: string; contratoId?: string }) {
    const v = await this.obtener(id);
    if (data.procesoId && !v.procesosVinculados.includes(data.procesoId)) v.procesosVinculados.push(data.procesoId);
    if (data.contratoId && !v.contratosVinculados.includes(data.contratoId)) v.contratosVinculados.push(data.contratoId);
    return v.save();
  }

  async agregarColaborador(id: string, colaborador: string) {
    const v = await this.obtener(id);
    if (!v.colaboradores.includes(colaborador)) v.colaboradores.push(colaborador);
    return v.save();
  }
}
