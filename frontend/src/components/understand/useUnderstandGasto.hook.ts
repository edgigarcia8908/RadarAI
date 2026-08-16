import { useState } from 'react';
import { UNDERSTAND_DEFAULT_FORM } from '../../constants/UNDERSTAND_GASTO';
import type { UnderstandGastoFormState } from '../../types/understand.types';

export interface UseUnderstandGastoReturn extends UnderstandGastoFormState {
  setDepartamento: (value: string) => void;
  setMunicipio: (value: string) => void;
  setPeriodo: (value: string) => void;
  setPregunta: (value: string) => void;
  handleAnalyze: () => void;
}

export default function useUnderstandGasto(): UseUnderstandGastoReturn {
  const [form, setForm] = useState<UnderstandGastoFormState>(UNDERSTAND_DEFAULT_FORM);

  function updateField(field: keyof UnderstandGastoFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleAnalyze() {
    setForm((current) => ({ ...current }));
  }

  return {
    ...form,
    setDepartamento: (value) => updateField('departamento', value),
    setMunicipio: (value) => updateField('municipio', value),
    setPeriodo: (value) => updateField('periodo', value),
    setPregunta: (value) => updateField('pregunta', value),
    handleAnalyze,
  };
}
