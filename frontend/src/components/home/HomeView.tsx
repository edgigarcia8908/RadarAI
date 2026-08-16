import React from 'react';
import { HOME_EXAMPLES, HOME_PROMPT_PLACEHOLDER } from '../../constants/HOME';
import type { HomeViewProps } from '../../types/home.types';
import HomeIcon from './HomeIcon';
import HomeSelect from './HomeSelect';
import useHome from './useHome.hook';
import AppSidebar from '../navigation/AppSidebar';

export default function HomeView({ onNavigate }: HomeViewProps) {
  const {
    departamento,
    municipio,
    periodo,
    prompt,
    municipiosDisponibles,
    mensajes,
    isLoading,
    setDepartamento,
    setMunicipio,
    setPeriodo,
    setPrompt,
    handlePromptSubmit,
    handleExampleClick,
  } = useHome();

  return (
    <div className="app-layout">
      <AppSidebar activeTarget="home" onNavigate={onNavigate} />
      <main className="app-main">
        <section className="home-content" aria-labelledby="home-title">
          <h1 id="home-title">RadarAI te ayuda a entender,<br />competir y decidir sobre<br />plata pública.</h1>
          <p className="home-subtitle">Haz una pregunta y conversa con RadarAI.</p>

          {mensajes.length > 0 && (
            <section className="home-chat-response" aria-label="Respuesta de RadarAI" aria-live="polite">
              <span className="home-chat-response-label">Respuesta de RadarAI</span>
              <div className="home-inline-messages">
                {mensajes.map((mensaje) => (
                  <div className={`home-inline-message home-inline-message-${mensaje.role}`} key={mensaje.id}>
                    {mensaje.text}
                  </div>
                ))}
                {isLoading && <div className="home-inline-typing">RadarAI está pensando…</div>}
              </div>
            </section>
          )}

          <section className="home-chat-shell" aria-label="Chat con RadarAI">
            <div className="home-chat-context">
              <span className="home-chat-context-title">Consultar en</span>
              <HomeSelect icon="map" label="Departamento" onChange={setDepartamento} options={['Cundinamarca', 'Bogotá', 'Antioquia', 'Valle del Cauca']} value={departamento} />
              <HomeSelect icon="home" label="Municipio" onChange={setMunicipio} options={municipiosDisponibles} value={municipio} />
              <HomeSelect icon="calendar" label="Periodo" onChange={setPeriodo} options={['2024', '2023', '2022', '2021']} value={periodo} />
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
                  <button aria-label="Enviar pregunta" className="btn btn-primary btn-icon-lg" disabled={isLoading} type="submit">
                    <HomeIcon name="arrow-up-right" size={24} />
                  </button>
                </div>
              </div>
            </form>
          </section>

          {mensajes.length === 0 && (
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
