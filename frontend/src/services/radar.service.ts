/**
 * Servicio de radar para llamadas al backend.
 * Funciones: verificarSigep, consultarChatAnnaMaria, obtenerFichaTerritorial.
 */

export const radarService = {
  /**
   * Verifica nombres contra SIGEP II.
   * Backend: POST /api/sigep/verificar
   */
  async verificarSigep(nombres: string[]): Promise<Record<string, unknown>> {
    if (!nombres.length) return {};

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
   * Chat de Anna María: consulta el backend y devuelve la respuesta en texto.
   * Backend: POST /api/chat/consultar (src/chat/)
   */
  async consultarChatAnnaMaria({
    mensaje,
    departamento,
    ciudad,
    periodo,
  }: {
    mensaje: string;
    departamento?: string;
    ciudad?: string;
    periodo?: string;
  }): Promise<string> {
    const response = await fetch('/api/chat/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, departamento, ciudad, periodo }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Backend de chat no disponible. Levanta el backend en el puerto 4500.');
    }
    return data.respuesta;
  },

  /**
   * Ficha territorial: consolida identidad DIVIPOLA, contratación,
   * presupuesto CUIPO, regalías SGR y desempeño MDM de un municipio.
   * Backend: GET /api/ficha-territorial
   */
  async obtenerFichaTerritorial(departamento: string | undefined, ciudad: string): Promise<unknown> {
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
