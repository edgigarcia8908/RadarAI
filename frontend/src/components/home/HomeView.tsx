import React from 'react';
import { HOME_EXAMPLES, HOME_NAV_ITEMS, HOME_PROMPT_PLACEHOLDER, HOME_ROUTES } from '../../constants/HOME';
import type { HomeViewProps } from '../../types/home.types';
import HomeIcon from './HomeIcon';
import useHome from './useHome.hook';

export default function HomeView({ onNavigate }: HomeViewProps) {
  const { prompt, setPrompt, handlePromptSubmit, handleExampleClick, handleRouteClick } = useHome({ onNavigate });

  return (
    <div className="home-layout">
      <aside className="home-sidebar">
        <div className="home-brand" aria-label="RadarAI">
          <span className="home-brand-mark"><span /><span /><span /></span>
          <span>RadarAI</span>
        </div>

        <nav className="home-nav" aria-label="Navegación principal">
          {HOME_NAV_ITEMS.map((item) => (
            <button
              className={`home-nav-item${item.id === 'home' ? ' home-nav-item-active' : ''}`}
              key={item.id}
              onClick={() => onNavigate(item.target)}
              type="button"
            >
              <HomeIcon name={item.icon} size={19} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="home-trust-note">
          <HomeIcon name="shield" size={20} />
          <span>Datos oficiales.<br />Respuestas<br />simples.</span>
        </div>
      </aside>

      <main className="home-main">
        <section className="home-content" aria-labelledby="home-title">
          <h1 id="home-title">RadarAI te ayuda a entender,<br />competir y decidir sobre<br />plata pública.</h1>
          <p className="home-subtitle">Haz una pregunta o elige una ruta para empezar.</p>

          <form className="home-prompt-form" onSubmit={handlePromptSubmit}>
            <HomeIcon name="sparkle" size={24} />
            <input
              aria-label={HOME_PROMPT_PLACEHOLDER}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={HOME_PROMPT_PLACEHOLDER}
              type="text"
              value={prompt}
            />
            <button aria-label="Empezar" className="home-submit" type="submit">
              <HomeIcon name="arrow-up-right" size={24} />
            </button>
          </form>

          <p className="home-section-label">Ejemplos para empezar</p>
          <div className="home-examples">
            {HOME_EXAMPLES.map((example) => (
              <button
                className={`home-example home-tone-${example.tone}`}
                key={example.id}
                onClick={() => handleExampleClick(example.target)}
                type="button"
              >
                <HomeIcon name={example.icon} size={23} />
                <span>{example.label}</span>
              </button>
            ))}
          </div>

          <p className="home-section-label home-route-label">Elige una ruta rápida</p>
          <div className="home-routes">
            {HOME_ROUTES.map((route) => (
              <button
                className="home-route"
                key={route.id}
                onClick={() => handleRouteClick(route.target)}
                type="button"
              >
                <span className={`home-route-icon home-tone-${route.tone}`}><HomeIcon name={route.icon} size={24} /></span>
                <span className="home-route-copy">
                  <strong>{route.title}</strong>
                  <span>{route.description}</span>
                </span>
                <HomeIcon name="arrow-up-right" size={20} />
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
