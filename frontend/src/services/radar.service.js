async function manejar(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Backend no disponible (${response.status}). Levanta el backend en el puerto 4500.`);
  }
  return data;
}

export const radarService = {
  buildSearchContext({ query, department, municipality }) {
    return {
      topic: query.trim() || 'Contratacion publica territorial',
      department,
      municipality,
    };
  },

  async verificarSigep(nombres) {
    if (!nombres.length) return {};
    return manejar(
      await fetch('/api/sigep/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres }),
      }),
    );
  },

  async verificarSiri(nombres) {
    if (!nombres.length) return {};
    return manejar(
      await fetch('/api/siri/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres }),
      }),
    );
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
    return manejar(await fetch(`/api/ficha-territorial?${params.toString()}`));
  },

  async sincronizar(input) {
    return manejar(
      await fetch('/api/ingestion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
  },

  async consultar(input) {
    return manejar(
      await fetch('/api/civic-intel/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
  },

  async obtenerPresupuestoCuipo({ departamento, ciudad, fechaDesde, fechaHasta }) {
    const params = new URLSearchParams();
    if (departamento) params.set('departamento', departamento);
    params.set('ciudad', ciudad);
    if (fechaDesde) params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params.set('fechaHasta', fechaHasta);
    return manejar(await fetch(`/api/cuipo/presupuesto?${params.toString()}`));
  },

  async obtenerMapaRiesgo() {
    return manejar(await fetch('/api/civic-intel/mapa'));
  },

  async generarEstudioMercado(input) {
    return manejar(
      await fetch('/api/estudios-mercado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
  },

  async crearEmpresa(input) {
    return manejar(
      await fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
  },

  async oportunidadesParaEmpresa(empresaId) {
    return manejar(await fetch(`/api/oportunidades/empresa/${empresaId}`));
  },

  // --- Veedurias ---
  async listarVeedurias() {
    return manejar(await fetch('/api/veedurias'));
  },

  async crearVeeduria(input) {
    return manejar(
      await fetch('/api/veedurias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    );
  },

  async obtenerVeeduria(id) {
    return manejar(await fetch(`/api/veedurias/${id}`));
  },

  async obtenerEvidenciaDetalle(id) {
    return manejar(await fetch(`/api/veedurias/${id}/evidencia-detalle`));
  },

  async agregarComentario(id, autor, texto) {
    return manejar(
      await fetch(`/api/veedurias/${id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor, texto }),
      }),
    );
  },

  async marcarChecklist(id, indice, hecho) {
    return manejar(
      await fetch(`/api/veedurias/${id}/checklist/${indice}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hecho }),
      }),
    );
  },

  async subirDocumento(id, file, subidoPor) {
    const form = new FormData();
    form.append('file', file);
    form.append('subidoPor', subidoPor);
    return manejar(await fetch(`/api/veedurias/${id}/documentos`, { method: 'POST', body: form }));
  },

  async preguntarSobreDocumentos(id, pregunta) {
    return manejar(
      await fetch(`/api/veedurias/${id}/preguntar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta }),
      }),
    );
  },
};
