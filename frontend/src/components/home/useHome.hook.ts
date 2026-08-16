import type { FormEvent } from 'react';
import { useState } from 'react';
import colombia from '../../colombia.json';
import { UNDERSTAND_DEFAULT_FORM } from '../../constants/UNDERSTAND_GASTO';
import { radarService } from '../../services/radar.service';
import type { HomeChatMessage } from '../../types/home.types';

export interface UseHomeReturn {
  departamento: string;
  municipio: string;
  periodo: string;
  prompt: string;
  municipiosDisponibles: string[];
  mensajes: HomeChatMessage[];
  isLoading: boolean;
  setDepartamento: (value: string) => void;
  setMunicipio: (value: string) => void;
  setPeriodo: (value: string) => void;
  setPrompt: (value: string) => void;
  handlePromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleExampleClick: (value: string) => void;
}

interface DepartamentoColombia {
  departamento: string;
  ciudades: string[];
}

const DEPARTAMENTOS = colombia as DepartamentoColombia[];

export default function useHome(): UseHomeReturn {
  const [departamento, setDepartamentoState] = useState(UNDERSTAND_DEFAULT_FORM.departamento);
  const [municipio, setMunicipio] = useState(UNDERSTAND_DEFAULT_FORM.municipio);
  const [periodo, setPeriodo] = useState(UNDERSTAND_DEFAULT_FORM.periodo);
  const [prompt, setPrompt] = useState('');
  const [mensajes, setMensajes] = useState<HomeChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const municipiosDisponibles = DEPARTAMENTOS.find((item) => item.departamento === departamento)?.ciudades ?? [];

  function addMessage(role: HomeChatMessage['role'], text: string) {
    setMensajes((current) => [...current, { id: `${role}-${current.length}`, role, text }]);
  }

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = prompt.trim();
    if (!question || isLoading) return;

    setPrompt('');
    addMessage('user', question);
    setIsLoading(true);

    void radarService.consultarChatAnnaMaria({
      mensaje: question,
      departamento,
      ciudad: municipio,
      periodo,
    }).then((response) => {
      addMessage('bot', response);
    }).catch((requestError: unknown) => {
      const message = requestError instanceof Error ? requestError.message : 'No pude responder en este momento.';
      addMessage('bot', message);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  function handleExampleClick(value: string) {
    setPrompt(value);
  }

  function handleDepartmentChange(value: string) {
    setDepartamentoState(value);
    setMunicipio(DEPARTAMENTOS.find((item) => item.departamento === value)?.ciudades[0] ?? '');
  }

  return {
    departamento,
    municipio,
    periodo,
    prompt,
    municipiosDisponibles,
    mensajes,
    isLoading,
    setDepartamento: handleDepartmentChange,
    setMunicipio,
    setPeriodo,
    setPrompt,
    handlePromptSubmit,
    handleExampleClick,
  };
}
