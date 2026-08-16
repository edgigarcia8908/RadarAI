import React, { type ReactNode } from 'react';
import { HOME_NAV_ITEMS } from '../../constants/HOME';
import type { HomeNavigationTarget } from '../../types/home.types';
import DataSourcesBadge from '../home/DataSourcesBadge';
import HomeIcon from '../home/HomeIcon';

interface SecondaryViewShellProps {
  activeTarget: HomeNavigationTarget;
  children: ReactNode;
  onNavigate: (target: HomeNavigationTarget) => void;
}

export default function SecondaryViewShell({ activeTarget, children, onNavigate }: SecondaryViewShellProps) {
  return (
    <div className="secondary-page">
      <aside className="secondary-sidebar">
        <div className="home-brand" aria-label="RadarAI">
          <span className="home-brand-mark"><span /><span /><span /></span>
          <span>RadarAI</span>
        </div>
        <nav className="home-nav" aria-label="Navegación principal">
          {HOME_NAV_ITEMS.map((item) => (
            <button
              className={`home-nav-item${item.target === activeTarget ? ' secondary-nav-active' : ''}`}
              key={item.id}
              onClick={() => onNavigate(item.target)}
              title={item.description}
              type="button"
            >
              <HomeIcon name={item.icon} size={19} />
              <span className="home-nav-item-copy">
                <strong>{item.label}</strong>
                <small>{item.subtitle}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="home-trust-note">
          <HomeIcon name="shield" size={20} />
          <span>Datos oficiales.<br />Respuestas<br />simples.</span>
        </div>
        <DataSourcesBadge />
      </aside>
      <main className="secondary-content">{children}</main>
    </div>
  );
}
