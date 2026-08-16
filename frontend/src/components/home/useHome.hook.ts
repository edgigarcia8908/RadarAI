import type { FormEvent } from 'react';
import { useState } from 'react';
import { HOME_EXAMPLES, HOME_ROUTES } from '../../constants/HOME';
import type { HomeNavigationTarget } from '../../types/home.types';

interface UseHomeParams {
  onNavigate: (target: HomeNavigationTarget) => void;
}

export interface UseHomeReturn {
  prompt: string;
  setPrompt: (value: string) => void;
  handlePromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  handleExampleClick: (target: HomeNavigationTarget) => void;
  handleRouteClick: (target: HomeNavigationTarget) => void;
}

export default function useHome({ onNavigate }: UseHomeParams): UseHomeReturn {
  const [prompt, setPrompt] = useState('');

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onNavigate('ciudadano');
  }

  function handleExampleClick(target: HomeNavigationTarget) {
    setPrompt(HOME_EXAMPLES.find((example) => example.target === target)?.label ?? '');
    onNavigate(target);
  }

  function handleRouteClick(target: HomeNavigationTarget) {
    setPrompt(HOME_ROUTES.find((route) => route.target === target)?.description ?? '');
    onNavigate(target);
  }

  return { prompt, setPrompt, handlePromptSubmit, handleExampleClick, handleRouteClick };
}
