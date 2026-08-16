import React from 'react';
import HomeIcon from './HomeIcon';
import useHomeResponse from './useHomeResponse.hook';
import type { HomeChatMessageProps, HomeResponseBlockProps } from '../../types/home.types';

function HomeResponseBlockView({
  block,
  getProgressWidth,
  getPercentageLabel,
}: HomeResponseBlockProps) {
  if (block.type === 'metrics') {
    return (
      <dl className="home-response-metrics">
        {block.items.map((metric) => (
          <div
            className={`home-response-metric home-response-metric-${metric.tone ?? 'neutral'}`}
            key={metric.id}
          >
            <span className="home-response-metric-icon">
              <HomeIcon name={metric.icon ?? 'trend'} size={19} />
            </span>
            <div>
              <dt>{metric.label}</dt>
              <dd title={metric.value}>{metric.value}</dd>
              {metric.detail && <small>{metric.detail}</small>}
            </div>
          </div>
        ))}
      </dl>
    );
  }

  if (block.type === 'ranking') {
    return (
      <section className="home-response-providers" aria-labelledby={`${block.id}-title`}>
        <div className="home-response-section-heading">
          <div>
            <h3 id={`${block.id}-title`}>{block.title}</h3>
            {block.subtitle && <p>{block.subtitle}</p>}
          </div>
          <HomeIcon name="trend" size={20} />
        </div>

        <ol className="home-provider-list">
          {block.items.map((item, itemIndex) => (
            <li key={item.id}>
              <span className="home-provider-rank">{String(itemIndex + 1).padStart(2, '0')}</span>
              <div className="home-provider-detail">
                <div className="home-provider-copy">
                  <strong>{item.name}</strong>
                  {item.value && <span>{item.value}</span>}
                </div>
                {item.detail && <span className="home-provider-note">{item.detail}</span>}
                {item.percentage !== undefined && (
                  <div
                    aria-label={`${item.name}: ${getPercentageLabel(item.percentage)}`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={item.percentage}
                    className="home-provider-progress"
                    role="progressbar"
                  >
                    <span style={{ width: getProgressWidth(item.percentage) }} />
                  </div>
                )}
              </div>
              {item.percentage !== undefined && (
                <strong className="home-provider-percentage">
                  {getPercentageLabel(item.percentage)}
                </strong>
              )}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (block.type === 'table') {
    return (
      <section className="home-response-table-section" aria-labelledby={`${block.id}-title`}>
        {block.title && <h3 id={`${block.id}-title`}>{block.title}</h3>}
        <div className="home-response-table-wrap">
          <table className="home-response-table">
            <thead>
              <tr>
                {block.columns.map((column) => <th key={column.id} scope="col">{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.id}>
                  {block.columns.map((column) => <td key={column.id}>{row.cells[column.id] ?? '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  if (block.type === 'notice') {
    return (
      <aside className={`home-response-notice home-response-notice-${block.tone}`}>
        <span><HomeIcon name={block.tone === 'critical' ? 'alert' : 'shield'} size={20} /></span>
        <div>
          <h3>{block.title}</h3>
          <p>{block.content}</p>
        </div>
      </aside>
    );
  }

  if (block.type === 'steps') {
    return (
      <section className="home-response-steps" aria-labelledby={`${block.id}-title`}>
        <h3 id={`${block.id}-title`}>{block.title}</h3>
        <ol>
          {block.items.map((item, itemIndex) => (
            <li key={item.id}>
              <span>{itemIndex + 1}</span>
              <div>
                <strong>{item.title}</strong>
                {item.description && <p>{item.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="home-response-details">
      {block.title && <h3>{block.title}</h3>}
      {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {block.bullets && block.bullets.length > 0 && (
        <ul>
          {block.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      )}
    </section>
  );
}

export default function HomeChatMessage({ message }: HomeChatMessageProps) {
  const { presentation, getProgressWidth, getPercentageLabel } = useHomeResponse(
    message.text,
    message.presentation,
  );

  if (message.role === 'user') {
    return <div className="home-inline-message home-inline-message-user">{message.text}</div>;
  }

  return (
    <article className={`home-response-card home-response-template-${presentation.template}`}>
      <header className="home-response-header">
        <span className="home-response-avatar"><HomeIcon name="sparkle" size={19} /></span>
        <div>
          {presentation.eyebrow && <span>{presentation.eyebrow}</span>}
          <h2>{presentation.title}</h2>
        </div>
      </header>

      {presentation.summary && <p className="home-response-summary">{presentation.summary}</p>}

      {presentation.blocks.map((block) => (
        <HomeResponseBlockView
          block={block}
          getPercentageLabel={getPercentageLabel}
          getProgressWidth={getProgressWidth}
          key={block.id}
        />
      ))}
    </article>
  );
}
