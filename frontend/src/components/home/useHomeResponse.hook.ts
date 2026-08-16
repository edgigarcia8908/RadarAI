import { useMemo } from 'react';
import { HOME_RESPONSE_COPY, HOME_RESPONSE_LIMITS } from '../../constants/HOME_RESPONSE';
import type {
  HomeResponseBlock,
  HomeResponseMetricItem,
  HomeResponsePresentation,
  HomeResponseRankingItem,
} from '../../types/home.types';

const CONTRACTS_PATTERN = /total de\s+([\d.,]+)\s+contratos/i;
const TOTAL_AMOUNT_PATTERN = /valor total de\s+(\$\s?[\d.,]+)/i;
const PROVIDER_DETAIL_PATTERN = /^[-•]\s*(.+?)\s+con un valor de\s+(\$\s?[\d.,]+)\s+y un porcentaje del\s+([\d.,]+)%\.?$/i;
const PROVIDER_CHART_PATTERN = /([\d.,]+)%\s*\(([^)]+)\)/;
const PROVIDER_SECTION_PATTERN = /los proveedores m[aá]s destacados son:?/i;
const DISTRIBUTION_SECTION_PATTERN = /se puede observar la distribuci[oó]n/i;

function parsePercentage(value: string): number {
  const normalizedValue = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const percentage = Number.parseFloat(normalizedValue);

  return Number.isFinite(percentage) ? percentage : 0;
}

function normalizeResponse(text: string): string {
  return (typeof text === 'string' ? text : '').replace(/\\n/g, '\n').replace(/\r/g, '').trim();
}

function getSummary(text: string): string {
  const providerSection = text.search(PROVIDER_SECTION_PATTERN);
  const summary = providerSection >= 0 ? text.slice(0, providerSection) : text.split('\n')[0];

  return summary.trim();
}

function getMetrics(text: string): HomeResponseMetricItem[] {
  const metrics: HomeResponseMetricItem[] = [];
  const contracts = text.match(CONTRACTS_PATTERN)?.[1];
  const amount = text.match(TOTAL_AMOUNT_PATTERN)?.[1]?.replace(/\s/g, '');

  if (contracts) {
    metrics.push({
      id: 'contracts',
      label: HOME_RESPONSE_COPY.contractsLabel,
      value: contracts,
      icon: 'briefcase',
      tone: 'positive',
    });
  }

  if (amount) {
    metrics.push({
      id: 'amount',
      label: HOME_RESPONSE_COPY.amountLabel,
      value: amount,
      icon: 'wallet',
      tone: 'warning',
    });
  }

  return metrics;
}

function getProviders(lines: string[]): HomeResponseRankingItem[] {
  const providers = new Map<string, HomeResponseRankingItem>();

  lines.forEach((line) => {
    const detailMatch = line.trim().match(PROVIDER_DETAIL_PATTERN);
    if (!detailMatch) return;

    const [, name, value, percentageLabel] = detailMatch;
    providers.set(name.trim().toLocaleLowerCase('es'), {
      id: name.trim().toLocaleLowerCase('es'),
      name: name.trim(),
      value: value.replace(/\s/g, ''),
      percentage: parsePercentage(percentageLabel),
    });
  });

  lines.forEach((line) => {
    const chartMatch = line.match(PROVIDER_CHART_PATTERN);
    if (!chartMatch) return;

    const [, percentageLabel, rawName] = chartMatch;
    const name = rawName.trim();
    const key = name.toLocaleLowerCase('es');
    if (providers.has(key)) return;

    providers.set(key, {
      id: key,
      name,
      percentage: parsePercentage(percentageLabel),
    });
  });

  return Array.from(providers.values())
    .sort((first, second) => (second.percentage ?? 0) - (first.percentage ?? 0))
    .slice(0, HOME_RESPONSE_LIMITS.maxProviders);
}

function getTextBlock(lines: string[], summary: string): HomeResponseBlock | null {
  const cleanLines = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !PROVIDER_SECTION_PATTERN.test(line))
    .filter((line) => !DISTRIBUTION_SECTION_PATTERN.test(line))
    .filter((line) => !PROVIDER_CHART_PATTERN.test(line));
  const bullets = cleanLines
    .filter((line) => /^[-•]\s+/.test(line))
    .filter((line) => !PROVIDER_DETAIL_PATTERN.test(line))
    .map((line) => line.replace(/^[-•]\s+/, ''));
  const paragraphs = cleanLines
    .filter((line) => !/^[-•]\s+/.test(line))
    .filter((line) => line !== summary);

  if (paragraphs.length === 0 && bullets.length === 0) return null;

  return {
    id: 'legacy-details',
    type: 'text',
    title: HOME_RESPONSE_COPY.additionalInfoTitle,
    paragraphs,
    bullets,
  };
}

function buildLegacyPresentation(text: string): HomeResponsePresentation {
  const normalizedText = normalizeResponse(text);
  const lines = normalizedText.split('\n');
  const summary = getSummary(normalizedText);
  const metrics = getMetrics(normalizedText);
  const providers = getProviders(lines);
  const textBlock = getTextBlock(lines, summary);
  const blocks: HomeResponseBlock[] = [];

  if (metrics.length > 0) blocks.push({ id: 'legacy-metrics', type: 'metrics', items: metrics });
  if (providers.length > 0) {
    blocks.push({
      id: 'legacy-ranking',
      type: 'ranking',
      title: HOME_RESPONSE_COPY.providersTitle,
      subtitle: HOME_RESPONSE_COPY.providersSubtitle,
      items: providers,
    });
  }
  if (textBlock) blocks.push(textBlock);

  const isStructured = metrics.length > 0 || providers.length > 0;

  return {
    version: '1.0',
    template: providers.length > 0 ? 'ranking' : 'summary',
    eyebrow: HOME_RESPONSE_COPY.eyebrow,
    title: isStructured ? HOME_RESPONSE_COPY.title : HOME_RESPONSE_COPY.genericTitle,
    summary,
    blocks,
  };
}

export interface UseHomeResponseReturn {
  presentation: HomeResponsePresentation;
  getProgressWidth: (percentage?: number) => string;
  getPercentageLabel: (percentage?: number) => string;
}

export default function useHomeResponse(
  text: string,
  presentation?: HomeResponsePresentation,
): UseHomeResponseReturn {
  const resolvedPresentation = useMemo(
    () => presentation ?? buildLegacyPresentation(text),
    [presentation, text],
  );

  function getProgressWidth(percentage = 0): string {
    const safePercentage = Math.min(
      Math.max(percentage, 0),
      HOME_RESPONSE_LIMITS.maxProgressPercentage,
    );

    return `${safePercentage}%`;
  }

  function getPercentageLabel(percentage = 0): string {
    return `${percentage.toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;
  }

  return {
    presentation: resolvedPresentation,
    getProgressWidth,
    getPercentageLabel,
  };
}
