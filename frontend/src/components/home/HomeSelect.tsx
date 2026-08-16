import React from 'react';
import type { HomeSelectProps } from '../../types/home.types';
import HomeIcon from './HomeIcon';
import useHomeSelect from './useHomeSelect.hook';

export default function HomeSelect({ label, value, options, icon, onChange }: HomeSelectProps) {
  const { isOpen, containerRef, toggle, selectOption } = useHomeSelect({ onChange });

  return (
    <div className="home-select" ref={containerRef}>
      <span className="home-select-label">{label}</span>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${label}: ${value}`}
        className={`home-select-trigger${isOpen ? ' home-select-trigger-open' : ''}`}
        onClick={toggle}
        type="button"
      >
        <HomeIcon name={icon} size={15} />
        <span>{value}</span>
        <HomeIcon name="chevron-right" size={15} />
      </button>

      {isOpen && (
        <div className="home-select-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              aria-selected={option === value}
              className={`home-select-option${option === value ? ' home-select-option-selected' : ''}`}
              key={option}
              onClick={() => selectOption(option)}
              role="option"
              type="button"
            >
              <span>{option}</span>
              {option === value && <HomeIcon name="badge-check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
