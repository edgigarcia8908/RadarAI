import React from 'react';

/**
 * RadarAI no trae datos de una sola base propia — cruza varias fuentes
 * públicas oficiales en vivo (Socrata/datos.gov.co). Sin esto, un usuario
 * nuevo asume que todo sale de una única BD nuestra y no entiende por qué
 * a veces la respuesta dice "verificado en vivo contra SIRI" o similar.
 */
const FUENTES = ['SECOP II', 'CUIPO', 'SIRI', 'SIGEP', 'DNP'];

export default function DataSourcesBadge() {
  return (
    <div className="data-sources-badge" title="Fuentes de datos abiertos oficiales que consulta RadarAI">
      <span className="data-sources-badge-label">Fuentes:</span>
      {FUENTES.map((fuente) => (
        <span className="data-sources-badge-pill" key={fuente}>{fuente}</span>
      ))}
    </div>
  );
}
