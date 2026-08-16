import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseHomeSelectParams {
  onChange: (value: string) => void;
}

export interface UseHomeSelectReturn {
  isOpen: boolean;
  containerRef: RefObject<HTMLDivElement>;
  toggle: () => void;
  selectOption: (value: string) => void;
}

export default function useHomeSelect({ onChange }: UseHomeSelectParams): UseHomeSelectReturn {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function toggle() {
    setIsOpen((current) => !current);
  }

  function selectOption(value: string) {
    onChange(value);
    setIsOpen(false);
  }

  return { isOpen, containerRef, toggle, selectOption };
}
