import { useState } from 'react';
import { obtenerPerfilPersona } from '../../api';
import type { PerfilPersona } from '../../api';

export interface UsePersonaReturn {
  nombre: string;
  setNombre: (value: string) => void;
  handleBuscar: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string;
  perfil: PerfilPersona | null;
}

/**
 * Antes esto solo existía navegando Veedurías → un contrato → "Ver
 * historial" (PerfilFuncionario.tsx, enterrado dos clics adentro). Ahora es
 * su propia vista: buscar cualquier nombre y ver todos sus contratos,
 * en cuántos municipios aparece, y alertas SIRI/SIGEP en vivo.
 */
export default function usePersona(): UsePersonaReturn {
  const [nombre, setNombre] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [perfil, setPerfil] = useState<PerfilPersona | null>(null);

  async function handleBuscar() {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 4) {
      setError('Escribe el nombre completo (nombre y apellido) de la persona a buscar.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    setPerfil(null);
    try {
      const resultado = await obtenerPerfilPersona(nombreLimpio);
      setPerfil(resultado);
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'No se pudo obtener el perfil.');
    }
  }

  return { nombre, setNombre, handleBuscar, status, error, perfil };
}
