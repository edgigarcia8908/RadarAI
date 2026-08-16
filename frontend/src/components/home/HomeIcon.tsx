import React from 'react';
import type { HomeIconName } from '../../types/home.types';

interface HomeIconProps {
  name: HomeIconName;
  size?: number;
}

export default function HomeIcon({ name, size = 20 }: HomeIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'home') {
    return <svg {...commonProps}><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-7h6v7" /></svg>;
  }
  if (name === 'badge-check' || name === 'award') {
    return <svg {...commonProps}><path d="m12 3 2.2 1.3 2.5-.1 1.2 2.2 2.1 1.3-.5 2.4.5 2.4-2.1 1.3-1.2 2.2-2.5-.1L12 21l-2.2-1.3-2.5.1-1.2-2.2L4 16.3l.5-2.4L4 11.5l2.1-1.3 1.2-2.2 2.5.1L12 3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
  }
  if (name === 'building-2') {
    return <svg {...commonProps}><path d="M4 21V5l8-2v18M12 21h8V9l-8-2M7 7h1M7 11h1M7 15h1M15 12h1M15 16h1M11 21v-4h2v4" /></svg>;
  }
  if (name === 'route') {
    return <svg {...commonProps}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h4a3 3 0 0 0 3-3v-8a3 3 0 0 1 3-3M16 19h2" /></svg>;
  }
  if (name === 'clipboard') {
    return <svg {...commonProps}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h3" /></svg>;
  }
  if (name === 'calendar') {
    return <svg {...commonProps}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg>;
  }
  if (name === 'map') {
    return <svg {...commonProps}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15M15 6v15" /></svg>;
  }
  if (name === 'wallet') {
    return <svg {...commonProps}><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2" /><path d="M16 12h4M17 12.01h.01" /></svg>;
  }
  if (name === 'alert') {
    return <svg {...commonProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5M12 16h.01" /></svg>;
  }
  if (name === 'chevron-right') {
    return <svg {...commonProps}><path d="m9 5 7 7-7 7" /></svg>;
  }
  if (name === 'opportunities' || name === 'briefcase') {
    return <svg {...commonProps}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg>;
  }
  if (name === 'monitor') {
    return <svg {...commonProps}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
  }
  if (name === 'server') {
    return <svg {...commonProps}><rect x="4" y="3" width="16" height="7" rx="1" /><rect x="4" y="14" width="16" height="7" rx="1" /><path d="M8 6h.01M8 17h.01M12 6h5M12 17h5" /></svg>;
  }
  if (name === 'network') {
    return <svg {...commonProps}><rect x="9" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><rect x="15" y="15" width="6" height="6" rx="1" /><path d="M12 9v3M6 15v-3h12v3" /></svg>;
  }
  if (name === 'search') {
    return <svg {...commonProps}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>;
  }
  if (name === 'arrow-right') {
    return <svg {...commonProps}><path d="M4 12h16M14 6l6 6-6 6" /></svg>;
  }
  if (name === 'scales') {
    return <svg {...commonProps}><path d="M12 4v16M7 20h10M5 7h14M7 7l-3 6a3 3 0 0 0 6 0L7 7ZM17 7l-3 6a3 3 0 0 0 6 0l-3-6Z" /></svg>;
  }
  if (name === 'people') {
    return <svg {...commonProps}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M15 15.5a4.5 4.5 0 0 1 5.5 4.5" /></svg>;
  }
  if (name === 'trend') {
    return <svg {...commonProps}><path d="m4 16 5-5 3 3 7-7" /><path d="M14 7h5v5" /></svg>;
  }
  if (name === 'sparkle') {
    return <svg {...commonProps}><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16ZM5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6L5 17Z" /></svg>;
  }
  if (name === 'shield') {
    return <svg {...commonProps}><path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></svg>;
  }
  return <svg {...commonProps}><path d="M5 19 19 5M10 5h9v9" /></svg>;
}
