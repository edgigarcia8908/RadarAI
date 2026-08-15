import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Empresa } from './empresa.schema';
import { extraerPalabrasClave } from '../common/keywords';

export interface CrearEmpresaInput {
  nombre: string;
  nit?: string;
  contactoEmail?: string;
  productosServicios: string;
  departamentos?: string[];
  ciudades?: string[];
  capacidadEconomicaMin?: number;
  capacidadEconomicaMax?: number;
}

@Injectable()
export class EmpresasService {
  constructor(@InjectModel(Empresa.name) private readonly model: Model<Empresa>) {}

  crear(data: CrearEmpresaInput) {
    return this.model.create({
      ...data,
      palabrasClave: extraerPalabrasClave(data.productosServicios),
    });
  }

  listar() {
    return this.model.find({ activo: true }).sort({ createdAt: -1 });
  }

  async obtener(id: string) {
    const empresa = await this.model.findById(id);
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }

  async actualizar(id: string, data: Partial<CrearEmpresaInput>) {
    const patch: Record<string, unknown> = { ...data };
    if (data.productosServicios) patch.palabrasClave = extraerPalabrasClave(data.productosServicios);
    const empresa = await this.model.findByIdAndUpdate(id, patch, { new: true });
    if (!empresa) throw new NotFoundException('Empresa no encontrada');
    return empresa;
  }
}
