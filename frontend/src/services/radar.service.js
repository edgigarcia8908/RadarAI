export const radarService = {
  buildSearchContext({ query, department, municipality }) {
    return {
      topic: query.trim() || 'Contratacion publica territorial',
      department,
      municipality,
    };
  },

  async verificarSigep(nombres) {
    if (!nombres.length) {
      return {};
    }

    const response = await fetch('/api/sigep/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombres }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Backend SIGEP no disponible. Levanta el backend en el puerto 4500 para consultar datos reales.');
    }

    return data;
  },

  /**
   * Ficha territorial: consolida identidad DIVIPOLA, contratacion,
   * presupuesto CUIPO, regalias SGR y desempeno MDM de un municipio en una
   * sola llamada. Backend: src/ficha-territorial/.
   */
  async obtenerFichaTerritorial(departamento, ciudad) {
    const params = new URLSearchParams();
    if (departamento) params.set('departamento', departamento);
    params.set('ciudad', ciudad);

    const response = await fetch(`/api/ficha-territorial?${params.toString()}`);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Backend de ficha territorial no disponible. Levanta el backend en el puerto 4500.');
    }
    return data;
  },
};
