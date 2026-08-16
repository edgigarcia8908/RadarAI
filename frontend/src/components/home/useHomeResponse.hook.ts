import { useMemo } from 'react';
import { HOME_RESPONSE_LIMITS } from '../../constants/HOME_RESPONSE';
import type { HomeResponsePresentation } from '../../types/home.types';

/**
 * Hook para resolver la presentación de un mensaje del chat.
 *
 * La presentación SIEMPRE viene del backend — es la IA la que analiza los
 * datos y decide qué bloques, títulos, métricas y alertas mostrar.
 *
 * Si por algún motivo el backend no manda presentación (error, versión vieja),
 * se muestra el texto tal cual en un bloque simple. Sin regex, sin parsing,
 * sin intentar adivinar estructura.
 */

function textAsFallback(text: string): HomeResponsePresentation {
  const clean = (typeof text === 'string' ? text : '').replace(/\\n/g, '\n').trim();
  const lines = clean.split('\n').filter(Boolean);
  const firstLine = lines[0] ?? '';
  const rest = lines.slice(1);

  return {
    version: '1.0',
    template: 'summary',
    title: firstLine.length > 80 ? firstLine.slice(0, 77) + '…' : firstLine,
    blocks: rest.length > 0
      ? [{
          id: 'text-fallback',
          type: 'text' as const,
          paragraphs: rest,
        }]
      : [],
  };
}

export interface UseHomeResponseReturn {
  presentation: HomeResponsePresentation;
  getProgressWidth: (percentage?: number) => string;
  getPercentageLabel: (percentage?: number) => string;
}

export default function useHomeResponse(
  text: string,
  presentation?: HomeResponsePresentation,
): UseHomeResponseReturn {
  const resolvedPresentation = useMemo(
    () => presentation ?? textAsFallback(text),
    [presentation, text],
  );

  function getProgressWidth(percentage = 0): string {
    const safePercentage = Math.min(
      Math.max(percentage, 0),
      HOME_RESPONSE_LIMITS.maxProgressPercentage,
    );

    return `${safePercentage}%`;
  }

  function getPercentageLabel(percentage = 0): string {
    return `${percentage.toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;
  }

  return {
    presentation: resolvedPresentation,
    getProgressWidth,
    getPercentageLabel,
  };
}
