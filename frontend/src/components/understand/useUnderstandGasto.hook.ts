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
  actualizando: boolean;
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
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ConsultaResultado | null>(null);
  const [syncInfo, setSyncInfo] = useState('');
  const [veeduriaCreadaId, setVeeduriaCreadaId] = useState<string | null>(null);

  function updateField(field: keyof UnderstandGastoFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  /**
   * Antes esto SIEMPRE esperaba a que terminara de sincronizar con SECOP
   * (varios segundos, a veces 15-20s) antes de mostrar cualquier cosa —
   * aunque ya hubiera datos de ese municipio en Mongo de una consulta
   * anterior. Ahora: primero se muestra lo que YA está sincronizado
   * (instantáneo, puede estar vacío la primera vez), y la sincronización
   * con SECOP corre después, en segundo plano, sin bloquear la pantalla —
   * cuando termina, se refresca el resultado solo. El usuario puede
   * interactuar con lo que ya hay mientras tanto.
   */
  async function handleAnalyze() {
    setStatus('loading');
    setError('');
    const { fechaDesde, fechaHasta } = periodoARango(form.periodo);
    // OJO: `tema` filtra por texto dentro del OBJETO del contrato (para
    // preguntas de tipo "mantenimiento de colegios"). NO hay que meterle la
    // pregunta completa acá — si el ciudadano pregunta por una PERSONA
    // ("¿cuántos contratos ha tenido Fulano?"), ese texto no aparece en el
    // objeto de ningún contrato y el filtro deja todo en cero silenciosamente,
    // sin avisar. Se deja `tema` vacío (trae todo el territorio) y la
    // pregunta completa se le pasa solo a la IA (redactarRespuesta ya recibe
    // una muestra de contratos con nombres de firmantes para poder buscar ahí).
    const tema = '';
    const pregunta = form.pregunta.trim() || `¿En qué ha gastado ${form.municipio} el dinero público?`;
    const consultaInput = { departamento: form.departamento, ciudad: form.municipio, tema, pregunta, fechaDesde, fechaHasta };

    try {
      setPaso('analizando');
      const resultadoPrevio = await consultar(consultaInput);
      setResultado(resultadoPrevio);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'No se pudo analizar el municipio.');
      setPaso(null);
      return;
    }
    setPaso(null);

    // Actualización en segundo plano — no bloquea lo que ya se ve.
    setActualizando(true);
    try {
      const r = await sincronizar({ departamento: form.departamento, ciudad: form.municipio, tema, fechaDesde, fechaHasta });
      setSyncInfo(`Actualizado con SECOP: ${r.procesos} procesos, ${r.contratos} contratos.`);
      const resultadoFresco = await consultar(consultaInput);
      setResultado(resultadoFresco);
    } catch {
      // Si la actualización en segundo plano falla, se queda con lo que ya se mostró — no es un error bloqueante.
    } finally {
      setActualizando(false);
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
    actualizando,
    error,
    resultado,
    syncInfo,
    veeduriaCreadaId,
    handleCrearVeeduriaDesdeHallazgo,
  };
}
