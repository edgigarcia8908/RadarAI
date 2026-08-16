import { useState } from 'react';
import { generarEstudioMercado, sincronizar } from '../../api';
import type { EstudioMercado } from '../../api';

function periodoARango(periodo: string): { fechaDesde: string; fechaHasta: string } {
  const hoy = new Date();
  const desde = new Date(hoy);
  if (periodo === 'Último año') desde.setFullYear(hoy.getFullYear() - 1);
  else if (periodo === 'Últimos 3 años') desde.setFullYear(hoy.getFullYear() - 3);
  else desde.setFullYear(hoy.getFullYear() - 2); // "Últimos 2 años" (default)
  return { fechaDesde: desde.toISOString().slice(0, 10), fechaHasta: hoy.toISOString().slice(0, 10) };
}

export interface UseCompareProvidersReturn {
  service: string;
  department: string;
  municipality: string;
  period: string;
  setService: (value: string) => void;
  setDepartment: (value: string) => void;
  setMunicipality: (value: string) => void;
  setPeriod: (value: string) => void;
  handleCompare: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  paso: 'sincronizando' | 'comparando' | null;
  error: string;
  estudio: EstudioMercado | null;
}

/**
 * Antes era un mock (handleCompare no hacía nada, 3 proveedores fijos
 * hardcodeados). Ahora llama al endpoint real de estudios de mercado —
 * PERO a diferencia de "Encontrar oportunidades" (que sincroniza antes de
 * consultar), este flujo consultaba directo lo que ya hubiera en Mongo, sin
 * traer nada nuevo de SECOP primero. Como Mongo solo tiene una fracción del
 * histórico real por territorio (~500-750 de varios miles), comparar
 * "Últimos 3 años" podía devolver muy pocos o cero contratos aunque SECOP sí
 * tuviera. Ahora sincroniza el territorio/rango pedido primero, igual que
 * Oportunidades — mismas cifras, más fieles a lo que hay realmente en SECOP.
 */
export default function useCompareProviders(): UseCompareProvidersReturn {
  const [service, setService] = useState('');
  const [department, setDepartment] = useState('Cundinamarca');
  const [municipality, setMunicipality] = useState('Tocancipá');
  const [period, setPeriod] = useState('Últimos 2 años');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [paso, setPaso] = useState<'sincronizando' | 'comparando' | null>(null);
  const [error, setError] = useState('');
  const [estudio, setEstudio] = useState<EstudioMercado | null>(null);

  async function handleCompare() {
    if (!service.trim()) return;
    setStatus('loading');
    setError('');
    setEstudio(null);
    const { fechaDesde, fechaHasta } = periodoARango(period);
    const ciudad = municipality === 'Todos' ? undefined : municipality;
    try {
      setPaso('sincronizando');
      await sincronizar({ departamento: department, ciudad, fechaDesde, fechaHasta });

      setPaso('comparando');
      const e = await generarEstudioMercado({
        objeto: service.trim(),
        departamento: department,
        ciudad,
        fechaDesde,
        fechaHasta,
      });
      setEstudio(e);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'No se pudo generar el estudio de mercado.');
    } finally {
      setPaso(null);
    }
  }

  return { service, department, municipality, period, setService, setDepartment, setMunicipality, setPeriod, handleCompare, status, paso, error, estudio };
}
