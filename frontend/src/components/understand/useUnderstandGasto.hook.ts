import { useState } from 'react';
import { consultar, sincronizar, crearVeeduria, ConsultaResultado, Hallazgo } from '../../api';
import { UNDERSTAND_DEFAULT_FORM } from '../../constants/UNDERSTAND_GASTO';
import type { UnderstandGastoFormState } from '../../types/understand.types';

/** "Este año" / "Último año" / "Últimos 3 años" -> rango de fechas real para la consulta. */
function periodoARango(periodo: string): { fechaDesde: string; fechaHasta: string } {
  const hoy = new Date();
  const desde = new Date(hoy);
  if (periodo === 'Este año') desde.setMonth(0, 1);
  else if (periodo === 'Últimos 3 años') desde.setFullYear(hoy.getFullYear() - 3);
  else desde.setFullYear(hoy.getFullYear() - 1); // "Último año" (default)
  return { fechaDesde: desde.toISOString().slice(0, 10), fechaHasta: hoy.toISOString().slice(0, 10) };
}

export interface UseUnderstandGastoReturn extends UnderstandGastoFormState {
  setDepartamento: (value: string) => void;
  setMunicipio: (value: string) => void;
  setPeriodo: (value: string) => void;
  setPregunta: (value: string) => void;
  handleAnalyze: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  paso: 'sincronizando' | 'analizando' | null;
  error: string;
  resultado: ConsultaResultado | null;
  syncInfo: string;
  veeduriaCreadaId: string | null;
  handleCrearVeeduriaDesdeHallazgo: (hallazgo: Hallazgo) => void;
}

/**
 * Antes esto era un mock (handleAnalyze no hacía nada, todo el panel de
 * resultados venía de constantes fijas en UNDERSTAND_GASTO.ts). Ahora usa
 * la misma llamada real que CiudadanoView.tsx: sincroniza SECOP para el
 * municipio elegido y consulta lo ya sincronizado.
 */
export default function useUnderstandGasto(): UseUnderstandGastoReturn {
  const [form, setForm] = useState<UnderstandGastoFormState>(UNDERSTAND_DEFAULT_FORM);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [paso, setPaso] = useState<'sincronizando' | 'analizando' | null>(null);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ConsultaResultado | null>(null);
  const [syncInfo, setSyncInfo] = useState('');
  const [veeduriaCreadaId, setVeeduriaCreadaId] = useState<string | null>(null);

  function updateField(field: keyof UnderstandGastoFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAnalyze() {
    setStatus('loading');
    setError('');
    setResultado(null);
    const { fechaDesde, fechaHasta } = periodoARango(form.periodo);
    const tema = form.pregunta.trim();
    const pregunta = form.pregunta.trim() || `¿En qué ha gastado ${form.municipio} el dinero público?`;

    try {
      setPaso('sincronizando');
      const r = await sincronizar({ departamento: form.departamento, ciudad: form.municipio, tema, fechaDesde, fechaHasta });
      setSyncInfo(`Traídos de SECOP: ${r.procesos} procesos, ${r.contratos} contratos.`);
      setPaso('analizando');
      const resultadoConsulta = await consultar({ departamento: form.departamento, ciudad: form.municipio, tema, pregunta, fechaDesde, fechaHasta });
      setResultado(resultadoConsulta);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'No se pudo analizar el municipio.');
    } finally {
      setPaso(null);
    }
  }

  async function handleCrearVeeduriaDesdeHallazgo(hallazgo: Hallazgo) {
    try {
      const v = await crearVeeduria({
        titulo: `${hallazgo.titulo} — ${form.municipio}, ${form.departamento}`,
        descripcion: hallazgo.detalle,
        departamento: form.departamento,
        ciudad: form.municipio,
        tema: form.pregunta,
        contratosVinculados: hallazgo.evidencia.map((e) => e.id),
      });
      setVeeduriaCreadaId(v._id);
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la veeduría.');
    }
  }

  return {
    ...form,
    setDepartamento: (value) => updateField('departamento', value),
    setMunicipio: (value) => updateField('municipio', value),
    setPeriodo: (value) => updateField('periodo', value),
    setPregunta: (value) => updateField('pregunta', value),
    handleAnalyze,
    status,
    paso,
    error,
    resultado,
    syncInfo,
    veeduriaCreadaId,
    handleCrearVeeduriaDesdeHallazgo,
  };
}
