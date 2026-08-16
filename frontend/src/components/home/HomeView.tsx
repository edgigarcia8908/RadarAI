import React, { useEffect, useRef } from 'react';
import { HOME_EXAMPLES, HOME_NAV_ITEMS, HOME_PROMPT_PLACEHOLDER } from '../../constants/HOME';
import { UNDERSTAND_PERIODS } from '../../constants/UNDERSTAND_GASTO';
import type { HomeViewProps } from '../../types/home.types';
import DataSourcesBadge from './DataSourcesBadge';
import HomeChatMessage from './HomeChatMessage';
import HomeIcon from './HomeIcon';
import HomeSelect from './HomeSelect';
import useHome from './useHome.hook';

export default function HomeView({ onNavigate }: HomeViewProps) {
  const {
    departamento,
    municipio,
    periodo,
    prompt,
    municipiosDisponibles,
    departamentosDisponibles,
    mensajes,
    isLoading,
    setDepartamento,
    setMunicipio,
    setPeriodo,
    setPrompt,
    handlePromptSubmit,
    handleExampleClick,
  } = useHome();

  // Auto-scroll al último mensaje — sin esto, en móvil (donde el área de
  // mensajes ahora tiene su propio scroll interno, ver CSS) una respuesta
  // nueva quedaba fuera de vista y parecía que "no se guardaba" la
  // conversación, cuando en realidad sí seguía ahí, solo había que
  // desplazarse a mano para verla.
  const finMensajesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes.length, isLoading]);

  const hayConversacion = mensajes.length > 0;

  return (
    <div className={`home-layout${hayConversacion ? ' home-layout-chatting' : ''}`}>
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

      <main className="home-main">
        <section className="home-content" aria-labelledby="home-title">
          <h1 id="home-title">RadarAI te ayuda a entender,<br />competir y decidir sobre<br />plata pública.</h1>
          <p className="home-subtitle">Haz una pregunta y conversa con RadarAI.</p>

          {hayConversacion && (
            <section className="home-chat-response" aria-label="Respuesta de RadarAI" aria-live="polite">
              <span className="home-chat-response-label">Respuesta de RadarAI</span>
              <div className="home-inline-messages">
                {mensajes.map((mensaje) => (
                  <HomeChatMessage key={mensaje.id} message={mensaje} />
                ))}
                {isLoading && <div className="home-inline-typing">RadarAI está pensando…</div>}
                <div ref={finMensajesRef} />
              </div>
            </section>
          )}

          <section className="home-chat-shell" aria-label="Chat con RadarAI">
            <div className="home-chat-context">
              <span className="home-chat-context-title">Consultar en</span>
              <HomeSelect icon="map" label="Departamento" onChange={setDepartamento} options={departamentosDisponibles} value={departamento} />
              <HomeSelect icon="home" label="Municipio" onChange={setMunicipio} options={municipiosDisponibles} value={municipio} />
              <HomeSelect icon="calendar" label="Periodo" onChange={setPeriodo} options={UNDERSTAND_PERIODS} value={periodo} />
            </div>

            <form className="home-chat-composer" onSubmit={handlePromptSubmit}>
              <div className="home-prompt-form">
                <div className="home-prompt-main">
                  <HomeIcon name="sparkle" size={24} />
                  <input
                    aria-label={HOME_PROMPT_PLACEHOLDER}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder={HOME_PROMPT_PLACEHOLDER}
                    type="text"
                    value={prompt}
                  />
                  <button aria-label="Enviar pregunta" className="home-submit" disabled={isLoading} type="submit">
                    <HomeIcon name="arrow-up-right" size={24} />
                  </button>
                </div>
              </div>
            </form>
          </section>

          {!hayConversacion && (
            <>
              <p className="home-section-label">Ejemplos para empezar</p>
              <div className="home-examples">
                {HOME_EXAMPLES.map((example) => (
                  <button
                    className={`home-example home-tone-${example.tone}`}
                    key={example.id}
                    onClick={() => handleExampleClick(example.label)}
                    type="button"
                  >
                    <HomeIcon name={example.icon} size={23} />
                    <span>{example.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
