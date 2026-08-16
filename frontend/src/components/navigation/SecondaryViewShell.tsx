import React, { type ReactNode } from 'react';
import AppSidebar from './AppSidebar';

interface SecondaryViewShellProps {
  activeTarget: 'veedurias' | 'mapa' | 'denuncias' | 'seguimiento';
  children: ReactNode;
  onNavigate: (target: string) => void;
}

export default function SecondaryViewShell({ activeTarget, children, onNavigate }: SecondaryViewShellProps) {
  return (
    <div className="app-layout">
      <AppSidebar activeTarget={activeTarget} onNavigate={onNavigate} showTrustNote={false} />
      <main className="app-main">{children}</main>
    </div>
  );
}
