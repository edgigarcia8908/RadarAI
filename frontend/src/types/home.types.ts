export type HomeIconName =
  | 'award'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'briefcase'
  | 'badge-check'
  | 'building-2'
  | 'calendar'
  | 'chevron-right'
  | 'home'
  | 'map'
  | 'monitor'
  | 'network'
  | 'opportunities'
  | 'people'
  | 'route'
  | 'scales'
  | 'search'
  | 'server'
  | 'shield'
  | 'sparkle'
  | 'trend'
  | 'wallet'
  | 'alert';

export type HomeNavigationTarget = 'empresa' | 'estudio' | 'veedurias' | 'mapa' | 'ficha' | 'persona' | 'home';

export interface HomeNavItem {
  id: string;
  label: string;
  /** Tooltip corto — qué hace ESPECÍFICAMENTE esta vista, para no confundirla con otra parecida (ej. "Perfil de persona" vs "Comparar proveedores"). */
  description: string;
  icon: HomeIconName;
  target: HomeNavigationTarget;
}

export interface HomeExample {
  id: string;
  label: string;
  icon: HomeIconName;
  tone: 'green' | 'lilac' | 'yellow';
}

export interface HomeViewProps {
  onNavigate: (target: HomeNavigationTarget) => void;
}

export interface HomeChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  presentation?: HomeResponsePresentation;
}

export type HomeResponseTone = 'neutral' | 'positive' | 'warning' | 'critical';

export type HomeResponseTemplate = 'summary' | 'ranking' | 'comparison' | 'steps' | 'alert';

export interface HomeResponseMetricItem {
  id: string;
  label: string;
  value: string;
  detail?: string;
  icon?: HomeIconName;
  tone?: HomeResponseTone;
}

export interface HomeResponseRankingItem {
  id: string;
  name: string;
  value?: string;
  percentage?: number;
  detail?: string;
}

export interface HomeResponseTableColumn {
  id: string;
  label: string;
}

export interface HomeResponseTableRow {
  id: string;
  cells: Record<string, string>;
}

export interface HomeResponseStepItem {
  id: string;
  title: string;
  description?: string;
}

export interface HomeResponseTextBlock {
  id: string;
  type: 'text';
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface HomeResponseMetricsBlock {
  id: string;
  type: 'metrics';
  items: HomeResponseMetricItem[];
}

export interface HomeResponseRankingBlock {
  id: string;
  type: 'ranking';
  title: string;
  subtitle?: string;
  items: HomeResponseRankingItem[];
}

export interface HomeResponseTableBlock {
  id: string;
  type: 'table';
  title?: string;
  columns: HomeResponseTableColumn[];
  rows: HomeResponseTableRow[];
}

export interface HomeResponseNoticeBlock {
  id: string;
  type: 'notice';
  title: string;
  content: string;
  tone: HomeResponseTone;
}

export interface HomeResponseStepsBlock {
  id: string;
  type: 'steps';
  title: string;
  items: HomeResponseStepItem[];
}

export type HomeResponseBlock =
  | HomeResponseTextBlock
  | HomeResponseMetricsBlock
  | HomeResponseRankingBlock
  | HomeResponseTableBlock
  | HomeResponseNoticeBlock
  | HomeResponseStepsBlock;

export interface HomeResponsePresentation {
  version: '1.0';
  template: HomeResponseTemplate;
  eyebrow?: string;
  title: string;
  summary?: string;
  blocks: HomeResponseBlock[];
}

export interface HomeChatMessageProps {
  message: HomeChatMessage;
}

export interface HomeResponseBlockProps {
  block: HomeResponseBlock;
  getProgressWidth: (percentage?: number) => string;
  getPercentageLabel: (percentage?: number) => string;
}

export interface HomeSelectProps {
  label: string;
  value: string;
  options: string[];
  icon: HomeIconName;
  onChange: (value: string) => void;
}
