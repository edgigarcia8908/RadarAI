import { useState } from 'react';
import { generarEstudioMercado } from '../../api';
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
  error: string;
  estudio: EstudioMercado | null;
}

/** Antes era un mock (handleCompare no hacía nada, 3 proveedores fijos hardcodeados). Ahora llama al mismo endpoint real que EstudioMercadoView.tsx. */
export default function useCompareProviders(): UseCompareProvidersReturn {
  const [service, setService] = useState('');
  const [department, setDepartment] = useState('Cundinamarca');
  const [municipality, setMunicipality] = useState('Tocancipá');
  const [period, setPeriod] = useState('Últimos 2 años');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [estudio, setEstudio] = useState<EstudioMercado | null>(null);

  async function handleCompare() {
    if (!service.trim()) return;
    setStatus('loading');
    setError('');
    setEstudio(null);
    const { fechaDesde, fechaHasta } = periodoARango(period);
    try {
      const e = await generarEstudioMercado({
        objeto: service.trim(),
        departamento: department,
        ciudad: municipality === 'Todos' ? undefined : municipality,
        fechaDesde,
        fechaHasta,
      });
      setEstudio(e);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'No se pudo generar el estudio de mercado.');
    }
  }

  return { service, department, municipality, period, setService, setDepartment, setMunicipality, setPeriod, handleCompare, status, error, estudio };
}
