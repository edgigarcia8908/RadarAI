import { HOME_NAV_ITEMS } from '../../constants/HOME';
import type { HomeNavigationTarget } from '../../types/home.types';
import HomeIcon from '../home/HomeIcon';

interface AppSidebarProps {
  activeTarget?: HomeNavigationTarget;
  onNavigate: (target: HomeNavigationTarget) => void;
  showTrustNote?: boolean;
}

export default function AppSidebar({ activeTarget = 'home', onNavigate, showTrustNote = true }: AppSidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="Navegación principal">
      <div className="app-brand" aria-label="RadarAI">
        <span className="app-brand-mark"><span /><span /><span /></span>
        <span>RadarAI</span>
      </div>

      <nav className="app-nav" aria-label="Navegación principal">
        {HOME_NAV_ITEMS.map((item) => (
          <button
            className={`app-nav-item${item.target === activeTarget ? ' app-nav-item-active' : ''}`}
            key={item.id}
            onClick={() => onNavigate(item.target as HomeNavigationTarget)}
            type="button"
            aria-current={item.target === activeTarget ? 'page' : undefined}
          >
            <HomeIcon name={item.icon} size={19} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {showTrustNote && (
        <div className="app-trust-note">
          <HomeIcon name="shield" size={20} />
          <span>Datos oficiales.<br />Respuestas<br />simples.</span>
        </div>
      )}
    </aside>
  );
}