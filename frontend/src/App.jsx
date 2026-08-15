import {
  ALERTS,
  MODULES,
  NAV_ITEMS,
  PAYMENTS,
  PUBLIC_OFFICIALS,
  REQUESTS,
  SUMMARY_CARDS,
  VIEWS,
} from './constants';
import { useRadarApp } from './useRadarApp.hook';
import FichaTerritorialWorkspace from './FichaTerritorialWorkspace';
import CitizenWorkspaceReal from './CitizenWorkspace';
import RiskMapWorkspaceReal from './RiskMapWorkspace';
import MarketWorkspaceReal from './MarketWorkspace';
import OversightWorkspaceReal from './OversightWorkspace';
import BusinessWorkspaceReal from './BusinessWorkspace';

function App() {
  const radar = useRadarApp();

  return (
    <div className="app-shell">
      <Header activeView={radar.activeView} onNavigate={radar.handleNavigate} />
      <main>
        {radar.activeView === VIEWS.HOME && <HomeView radar={radar} />}
        {radar.activeView !== VIEWS.HOME && <WorkspaceView radar={radar} />}
      </main>
      <Footer />
    </div>
  );
}

function Header({ activeView, onNavigate }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => onNavigate(VIEWS.HOME)}>
        <span className="brand-mark" aria-hidden="true">▥</span>
        <span>RadarAI Transparencia</span>
      </button>
      <nav className="main-nav" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? 'nav-item active' : 'nav-item'}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="top-actions" aria-label="Acciones rapidas">
        <button className="icon-button" type="button" aria-label="Notificaciones">⌂</button>
        <button className="icon-button" type="button" aria-label="Configuracion">⚙</button>
        <button className="access-button" type="button">Acceso</button>
      </div>
    </header>
  );
}

function HomeView({ radar }) {
  return (
    <section className="home-page">
      <div className="hero">
        <p className="eyebrow">Inteligencia publica y de mercado</p>
        <h1>Que quieres investigar?</h1>
        <p className="hero-copy">
          Explora presupuesto, contratos, proyectos publicos y alertas territoriales desde una sola consola.
        </p>

        <SearchPanel radar={radar} />
        <ExampleSearches examples={radar.examples} onExampleClick={radar.handleExampleClick} />
      </div>

      <ActiveContext context={radar.searchContext} onNavigate={radar.handleNavigate} />
      <SummaryGrid />
      <ProductModules onNavigate={radar.handleNavigate} />
      <DashboardPreview />
    </section>
  );
}

function SearchPanel({ radar }) {
  return (
    <form className="search-panel" onSubmit={radar.handleSearchSubmit}>
      <label className="search-label" htmlFor="main-search">Buscar en contratos, proyectos y datos abiertos</label>
      <div className="search-input-row">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          id="main-search"
          value={radar.query}
          onChange={(event) => radar.setQuery(event.target.value)}
          placeholder="Que paso con el dinero destinado a los damnificados?"
        />
      </div>
      <div className="filter-row">
        <label>
          <span>Departamento</span>
          <select value={radar.selectedDepartment} onChange={(event) => radar.setDepartment(event.target.value)}>
            {radar.departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Municipio</span>
          <select value={radar.municipality} onChange={(event) => radar.setMunicipality(event.target.value)}>
            {radar.municipalities.map((municipality) => (
              <option key={municipality} value={municipality}>{municipality}</option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          <span aria-hidden="true">⌕</span>
          Buscar
        </button>
      </div>
    </form>
  );
}

function ExampleSearches({ examples, onExampleClick }) {
  return (
    <div className="examples">
      <p className="section-label">Ejemplos de busqueda:</p>
      <div className="chip-row">
        {examples.map((example) => (
          <button className="query-chip" key={example} type="button" onClick={() => onExampleClick(example)}>
            <span aria-hidden="true">→</span>
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveContext({ context, onNavigate }) {
  return (
    <section className="active-context">
      <p className="section-label">Contexto de busqueda activo</p>
      <div className="context-card">
        <span className="context-pill">Tema: {context.topic}</span>
        <span className="divider">/</span>
        <span className="context-pill">Departamento: {context.department}</span>
        <span className="divider">/</span>
        <span className="context-pill">Municipio: {context.municipality}</span>
        <button className="secondary-button" type="button" onClick={() => onNavigate(VIEWS.CITIZEN)}>
          Cambiar filtros
        </button>
      </div>
    </section>
  );
}

function SummaryGrid() {
  return (
    <section className="summary-grid" aria-label="Resumen operativo">
      {SUMMARY_CARDS.map((card) => (
        <article className="metric-card" key={card.id}>
          <div className="metric-heading">
            <span>{card.label}</span>
            <span className="metric-icon" aria-hidden="true">□</span>
          </div>
          <div className="metric-value">{card.value}</div>
          <div className={`metric-detail ${card.tone}`}>{card.detail}</div>
          <div className="progress-track">
            <span className={`progress-fill ${card.tone}`} />
          </div>
        </article>
      ))}
    </section>
  );
}

function ProductModules({ onNavigate }) {
  return (
    <section className="modules-section">
      <div className="section-heading">
        <p className="section-label">Producto RadarAI</p>
        <h2>Flujos principales</h2>
      </div>
      <div className="module-grid">
        {MODULES.map((module) => (
          <button className="module-card" key={module.id} type="button" onClick={() => onNavigate(module.id)}>
            <span className="module-eyebrow">{module.eyebrow}</span>
            <strong>{module.title}</strong>
            <span>{module.description}</span>
            <em>{module.metric}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="dashboard-layout">
      <article className="table-card">
        <div className="card-header">
          <h2>Ultimas solicitudes ciudadanas</h2>
          <button className="text-button" type="button">Ver todas</button>
        </div>
        <div className="data-table" role="table" aria-label="Ultimas solicitudes">
          <div className="table-row table-head" role="row">
            <span>ID</span>
            <span>Asunto</span>
            <span>Prioridad</span>
            <span>Estado</span>
          </div>
          {REQUESTS.map((request) => (
            <div className="table-row" role="row" key={request.id}>
              <span>{request.id}</span>
              <span>{request.subject}</span>
              <span><Badge tone={request.priority}>{request.priority}</Badge></span>
              <span><Badge tone={request.status}>{request.status}</Badge></span>
            </div>
          ))}
        </div>
      </article>
      <aside className="side-stack">
        <AlertsPanel />
        <PaymentsPanel />
      </aside>
    </section>
  );
}

function WorkspaceView({ radar }) {
  const activeModule = MODULES.find((module) => module.id === radar.activeView);

  return (
    <section className="workspace-page">
      <div className="workspace-hero">
        <div>
          <p className="breadcrumb">Inicio / {activeModule?.eyebrow}</p>
          <h1>{activeModule?.title}</h1>
          <p>{activeModule?.description}</p>
        </div>
        <button className="secondary-button" type="button" onClick={() => radar.handleNavigate(VIEWS.HOME)}>
          Volver al inicio
        </button>
      </div>
      <WorkspaceContent view={radar.activeView} context={radar.searchContext} radar={radar} />
    </section>
  );
}

function WorkspaceContent({ view, radar }) {
  if (view === VIEWS.CITIZEN) {
    return <CitizenWorkspaceReal radar={radar} />;
  }

  if (view === VIEWS.BUSINESS) {
    return <BusinessWorkspaceReal radar={radar} />;
  }

  if (view === VIEWS.OVERSIGHT) {
    return <OversightWorkspaceReal radar={radar} />;
  }

  if (view === VIEWS.RISK_MAP) {
    return <RiskMapWorkspaceReal radar={radar} />;
  }

  if (view === VIEWS.TERRITORY_PROFILE) {
    return <FichaTerritorialWorkspace radar={radar} />;
  }

  return <MarketWorkspaceReal radar={radar} />;
}

function RiskMapWorkspace() {
  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Mapa de riesgo</p>
        <h2>Concentracion de proveedores por municipio</h2>
        <div className="map-illustration" aria-label="Mapa de Colombia con puntos de riesgo">
          <span className="map-dot dot-one" />
          <span className="map-dot dot-two" />
          <span className="map-dot dot-three" />
          <span className="map-dot dot-four" />
        </div>
      </article>
      <aside className="detail-card">
        <p className="section-label">Detalles especificos</p>
        <h3>Mayor concentracion</h3>
        <p className="muted">Tocancipa registra 78% de valor adjudicado en tres proveedores.</p>
      </aside>
    </div>
  );
}

function MarketWorkspace() {
  return (
    <div className="content-grid">
      <article className="detail-card large">
        <p className="section-label">Estudio de mercado</p>
        <h2>Contratos comparables para mantenimiento de vias</h2>
        <div className="stat-row">
          <Stat label="Valor minimo" value="$310M" />
          <Stat label="Promedio" value="$760M" />
          <Stat label="Mediana" value="$690M" />
        </div>
        <PaymentsPanel />
      </article>
      <aside className="detail-card">
        <p className="section-label">Proveedor frecuente</p>
        <h3>Consorcio Vial Centro</h3>
        <p className="muted">7 contratos comparables por $8.4B COP.</p>
      </aside>
    </div>
  );
}

function Timeline() {
  return (
    <div className="timeline">
      <h3>Ruta de ejecucion</h3>
      <div className="timeline-item done">
        <strong>Asignacion de recursos</strong>
        <span>Aprobacion presupuestal completada. 30 Oct 2025</span>
      </div>
      <div className="timeline-item done">
        <strong>Contratacion</strong>
        <span>Licitacion publica adjudicada. 15 Nov 2025</span>
      </div>
      <div className="timeline-item current">
        <strong>Transporte</strong>
        <span>En transito hacia puntos de acopio en Quibdo.</span>
      </div>
      <div className="timeline-item">
        <strong>Entrega final</strong>
        <span>Pendiente. Programado para iniciar el 10 Dic 2025.</span>
      </div>
    </div>
  );
}

function AlertsPanel() {
  return (
    <article className="alerts-card">
      <h2>Alertas criticas</h2>
      {ALERTS.map((alert) => (
        <div className={`alert-item ${alert.tone}`} key={alert.id}>
          <strong>{alert.title}</strong>
          <p>{alert.detail}</p>
        </div>
      ))}
    </article>
  );
}

function SigepPanel({ radar, compact = false }) {
  const hasMatches = Object.keys(radar.sigepMatches).length > 0;

  return (
    <section className={compact ? 'sigep-panel compact' : 'sigep-panel'}>
      <div className="sigep-heading">
        <div>
          <p className="section-label">SIGEP II</p>
          <h3>Cargos de confianza</h3>
        </div>
        <button className="secondary-button" type="button" onClick={radar.handleVerifySigep} disabled={radar.sigepStatus === 'loading'}>
          {radar.sigepStatus === 'loading' ? 'Verificando...' : 'Verificar nombres'}
        </button>
      </div>
      <p className="sigep-disclaimer">
        Cruza ordenador del gasto y supervisor contra puestos sensibles a corrupcion. Es contexto publico, no una acusacion:
        la coincidencia es por nombre, no por identidad verificada.
      </p>
      {radar.sigepStatus === 'error' && <p className="sigep-error">{radar.sigepError}</p>}
      {radar.sigepStatus === 'success' && !hasMatches && (
        <p className="sigep-empty">No hubo coincidencias SIGEP para los nombres de ejemplo.</p>
      )}
      <div className="official-list">
        {PUBLIC_OFFICIALS.map((official) => (
          <OfficialSigepRow
            key={official.id}
            match={radar.sigepMatches[official.name]}
            official={official}
          />
        ))}
      </div>
    </section>
  );
}

function OfficialSigepRow({ official, match }) {
  const firstMatch = match?.[0];

  return (
    <article className="official-row">
      <div>
        <strong>{official.name}</strong>
        <span>{official.role} - {official.entity}</span>
      </div>
      {firstMatch ? (
        <div className="sigep-badge">
          <strong>{firstMatch.cargo || 'Cargo de confianza'}</strong>
          <span>{firstMatch.entidad || 'Entidad SIGEP no especificada'}</span>
          {firstMatch.asignacionBasica ? <span>Asignacion basica: ${firstMatch.asignacionBasica}</span> : null}
        </div>
      ) : (
        <span className="badge nuevo">Sin coincidencia verificada</span>
      )}
    </article>
  );
}

function PaymentsPanel() {
  return (
    <article className="detail-card">
      <h2>Cronograma de pagos</h2>
      <div className="payment-progress">
        <span />
      </div>
      <div className="data-table compact" role="table" aria-label="Cronograma de pagos">
        <div className="table-row table-head" role="row">
          <span>Hito</span>
          <span>Fecha</span>
          <span>Monto</span>
          <span>Estado</span>
        </div>
        {PAYMENTS.map((payment) => (
          <div className="table-row" role="row" key={payment.id}>
            <span>{payment.milestone}</span>
            <span>{payment.date}</span>
            <span>{payment.amount}</span>
            <span><Badge tone={payment.status}>{payment.status}</Badge></span>
          </div>
        ))}
      </div>
    </article>
  );
}

function Checklist() {
  const items = ['Conformar equipo ciudadano', 'Solicitar documentos SECOP', 'Contrastar hitos y pagos', 'Publicar informe final'];

  return (
    <div className="checklist">
      {items.map((item) => (
        <label key={item}>
          <input type="checkbox" defaultChecked={item !== 'Publicar informe final'} />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

function DocumentList() {
  return (
    <div className="document-list">
      <span>Pliego de condiciones.pdf</span>
      <span>Resolucion de adjudicacion.pdf</span>
      <span>Auditoria contraloria.xlsx</span>
    </div>
  );
}

function MapCard() {
  return (
    <article className="detail-card">
      <h2>Puntos de entrega</h2>
      <div className="mini-map" aria-label="Puntos de entrega en mapa">
        <span className="map-dot dot-one" />
        <span className="map-dot dot-two" />
        <span className="map-dot dot-three" />
      </div>
      <button className="text-button centered" type="button">Ver detalles interactivos</button>
    </article>
  );
}

function Stat({ label, value, highlighted = false }) {
  return (
    <div className={highlighted ? 'stat-card highlighted' : 'stat-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Badge({ tone, children }) {
  const normalizedTone = String(tone).toLowerCase().replace(/\s+/g, '-');

  return <span className={`badge ${normalizedTone}`}>{children}</span>;
}

function Footer() {
  return (
    <footer className="footer">
      <strong>RadarAI Transparencia</strong>
      <span>Mapa del sitio</span>
      <span>Contacto</span>
      <span>Politica de datos</span>
      <span>Accesibilidad</span>
      <span>© 2026 Portal de Transparencia Fiscal.</span>
    </footer>
  );
}

export default App;
