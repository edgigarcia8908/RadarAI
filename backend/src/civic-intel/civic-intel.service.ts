import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proceso } from '../ingestion/proceso.schema';
import { Contrato } from '../ingestion/contrato.schema';
import { completar } from '../lib/llm';
import { normalizar } from '../common/normalizar';
import { departamentoRealSecop } from '../common/departamento-secop';
import { palabrasConSinonimos } from '../common/sinonimos';
import { valorPlausible } from '../common/valores';
import { formatearPesos } from '../common/formatear-pesos';

export interface ConsultaInput {
  departamento?: string;
  ciudad?: string;
  /** Tema en lenguaje libre, ej: "mantenimiento de colegios" — se usa para filtrar por texto. */
  tema: string;
  /** La pregunta completa del ciudadano, se le pasa tal cual al LLM para redactar la respuesta. */
  pregunta: string;
  /** 'YYYY-MM-DD' — filtra sobre lo ya sincronizado en Mongo (independiente del rango usado al sincronizar). */
  fechaDesde?: string;
  fechaHasta?: string;
}

interface Hallazgo {
  tipo: 'CONCENTRACION' | 'CONTRATOS_SIMILARES';
  severidad: 'ALTA' | 'MEDIA';
  titulo: string;
  detalle: string;
  evidencia: { entidad: string; id: string; link?: string }[];
}

@Injectable()
export class CivicIntelService {
  private readonly logger = new Logger(CivicIntelService.name);

  constructor(
    @InjectModel(Proceso.name) private readonly procesoModel: Model<Proceso>,
    @InjectModel(Contrato.name) private readonly contratoModel: Model<Contrato>,
  ) {}

  /** Compara siempre contra los campos *Normalizado guardados en la ingesta — ignora tildes/mayúsculas/puntuación. */
  private filtroTerritorio(departamento?: string, ciudad?: string, campoDepto = 'departamentoEntidadNormalizado', campoCiudad = 'ciudadEntidadNormalizado') {
    // Bogotá no es parte de Cundinamarca en SECOP — ver departamento-secop.ts.
    const departamentoReal = departamentoRealSecop(departamento, ciudad);
    const filtro: Record<string, unknown> = {};
    if (departamentoReal) filtro[campoDepto] = normalizar(departamentoReal);
    if (ciudad) filtro[campoCiudad] = normalizar(ciudad);
    return filtro;
  }

  /** Concentración de proveedores: top proveedores por valor, y qué % del total representan los 2 mayores. */
  private detectarConcentracion(contratos: Contrato[]): Hallazgo | null {
    const porProveedor = new Map<string, { nombre: string; valor: number; contratos: string[] }>();
    let total = 0;
    for (const c of contratos) {
      const valor = valorPlausible(c.valorDelContrato);
      total += valor;
      const key = c.nitProveedor || c.proveedorAdjudicado;
      if (!key) continue;
      if (!porProveedor.has(key)) porProveedor.set(key, { nombre: c.proveedorAdjudicado, valor: 0, contratos: [] });
      const entry = porProveedor.get(key)!;
      entry.valor += valor;
      entry.contratos.push(c.idContrato);
    }
    if (total === 0 || porProveedor.size === 0) return null;

    const top = [...porProveedor.values()].sort((a, b) => b.valor - a.valor).slice(0, 2);
    const porcentaje = (top.reduce((s, p) => s + p.valor, 0) / total) * 100;
    if (porcentaje < 50) return null;

    return {
      tipo: 'CONCENTRACION',
      severidad: porcentaje >= 70 ? 'ALTA' : 'MEDIA',
      titulo: 'Concentración de proveedores',
      detalle: `${top.length} proveedor(es) (${top.map((p) => p.nombre).join(', ')}) representan el ${porcentaje.toFixed(0)}% del valor contratado en este tema/territorio.`,
      evidencia: top.flatMap((p) => p.contratos.slice(0, 5).map((id) => ({ entidad: p.nombre, id }))),
    };
  }

  /** Contratos cuyo objeto contractual normalizado es idéntico o casi idéntico entre sí (posible fraccionamiento). */
  private detectarContratosSimilares(contratos: Contrato[]): Hallazgo | null {
    const grupos = new Map<string, Contrato[]>();
    for (const c of contratos) {
      const texto = normalizar(c.objetoDelContrato || c.descripcionDelProceso || '');
      if (texto.length < 15) continue;
      const clave = texto.split(' ').slice(0, 8).join(' '); // primeras 8 palabras normalizadas como huella
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave)!.push(c);
    }
    const grupoMasGrande = [...grupos.values()].filter((g) => g.length >= 2).sort((a, b) => b.length - a.length)[0];
    if (!grupoMasGrande) return null;

    return {
      tipo: 'CONTRATOS_SIMILARES',
      severidad: grupoMasGrande.length >= 5 ? 'ALTA' : 'MEDIA',
      titulo: 'Contratos con objeto similar',
      detalle: `Se encontraron ${grupoMasGrande.length} contratos con objetos contractuales altamente similares — puede indicar fraccionamiento o un mismo servicio contratado repetidas veces.`,
      evidencia: grupoMasGrande.slice(0, 8).map((c) => ({ entidad: c.nombreEntidad, id: c.idContrato, link: c.urlProceso || undefined })),
    };
  }

  async consultar(input: ConsultaInput) {
    // Palabras normalizadas (sin tildes/mayúsculas) del tema + sinónimos conocidos
    // (SECOP dice "PAE", no "alimentación") — ver common/sinonimos.ts.
    const palabrasTema = palabrasConSinonimos(input.tema);
    const temaRegex = palabrasTema.length ? new RegExp(palabrasTema.join('|'), 'i') : null;

    const filtroProcesos: Record<string, unknown> = this.filtroTerritorio(input.departamento, input.ciudad);
    const filtroContratos: Record<string, unknown> = this.filtroTerritorio(
      input.departamento,
      input.ciudad,
      'departamentoNormalizado',
      'ciudadNormalizado',
    );
    if (temaRegex) {
      filtroProcesos.textoNormalizado = temaRegex;
      filtroContratos.textoNormalizado = temaRegex;
    }

    if (input.fechaDesde || input.fechaHasta) {
      const rango: Record<string, Date> = {};
      if (input.fechaDesde) rango.$gte = new Date(`${input.fechaDesde}T00:00:00`);
      if (input.fechaHasta) rango.$lte = new Date(`${input.fechaHasta}T23:59:59`);
      filtroProcesos.fechaPublicacion = rango;
      filtroContratos.fechaDeFirma = rango;
    }

    const [procesos, contratos] = await Promise.all([
      this.procesoModel.find(filtroProcesos).sort({ fechaPublicacion: -1 }).limit(500).lean<Proceso[]>(),
      this.contratoModel.find(filtroContratos).sort({ fechaDeFirma: -1 }).limit(500).lean<Contrato[]>(),
    ]);

    const valorTotal = contratos.reduce((s, c) => s + valorPlausible(c.valorDelContrato), 0);
    const proveedoresUnicos = new Set(contratos.map((c) => c.nitProveedor || c.proveedorAdjudicado).filter(Boolean));

    const hallazgos = [this.detectarConcentracion(contratos as Contrato[]), this.detectarContratosSimilares(contratos as Contrato[])].filter(
      (h): h is Hallazgo => h !== null,
    );

    const resumen = {
      territorio: [input.ciudad, input.departamento].filter(Boolean).join(', ') || 'Colombia',
      tema: input.tema,
      valorTotalContratado: valorTotal,
      totalProcesos: procesos.length,
      totalContratos: contratos.length,
      proveedoresUnicos: proveedoresUnicos.size,
    };

    const respuesta = await this.redactarRespuesta(input, resumen, hallazgos, contratos as Contrato[]);

    return {
      resumen,
      hallazgos,
      respuesta,
      evidenciaProcesos: procesos.slice(0, 20),
      evidenciaContratos: contratos.slice(0, 20),
    };
  }

  /**
   * Mapa de calor: agrega TODO lo ya sincronizado en Mongo (sin volver a
   * pegarle a Socrata) por municipio, y calcula un score de riesgo simple
   * — hoy solo concentración de proveedores (mismo criterio que
   * `detectarConcentracion`, aplicado por municipio en vez de por
   * consulta puntual). Con más volumen ingerido (ver "Cron de ingesta" en
   * el README) esto se vuelve más representativo — con poca data, un
   * municipio con 2 contratos y 1 solo proveedor da 100% "riesgo" sin que
   * signifique gran cosa; por eso se devuelve también `totalContratos`,
   * para que el frontend pueda pesarlo (ej. tamaño del punto en el mapa).
   */
  async mapaRiesgo() {
    const contratos = await this.contratoModel
      .find({ departamento: { $ne: '' }, ciudad: { $ne: '' } })
      .lean<Contrato[]>();

    const porMunicipio = new Map<
      string,
      { departamento: string; ciudad: string; contratos: Contrato[]; valorTotal: number }
    >();
    for (const c of contratos) {
      const key = `${c.departamento}|||${c.ciudad}`;
      if (!porMunicipio.has(key)) porMunicipio.set(key, { departamento: c.departamento, ciudad: c.ciudad, contratos: [], valorTotal: 0 });
      const entry = porMunicipio.get(key)!;
      entry.contratos.push(c);
      entry.valorTotal += valorPlausible(c.valorDelContrato);
    }

    return [...porMunicipio.values()].map((m) => {
      const porProveedor = new Map<string, number>();
      for (const c of m.contratos) {
        const key = c.nitProveedor || c.proveedorAdjudicado;
        if (!key) continue;
        porProveedor.set(key, (porProveedor.get(key) || 0) + valorPlausible(c.valorDelContrato));
      }
      const top2 = [...porProveedor.values()].sort((a, b) => b - a).slice(0, 2).reduce((s, v) => s + v, 0);
      const concentracion = m.valorTotal > 0 ? Math.round((top2 / m.valorTotal) * 100) : 0;

      return {
        departamento: m.departamento,
        ciudad: m.ciudad,
        totalContratos: m.contratos.length,
        valorTotal: m.valorTotal,
        proveedoresUnicos: porProveedor.size,
        concentracionProveedores: concentracion,
      };
    });
  }

  /**
   * Perfil de un funcionario (supervisor u ordenador del gasto) A TRAVÉS DE
   * TODO EL TERRITORIO ya sincronizado — no solo el municipio consultado.
   * Responde algo que ninguna consulta por territorio puede sola: si esta
   * persona pasó por varios municipios/entidades, ¿siempre termina
   * contratando a los mismos proveedores? Eso es la huella de una red que
   * "sigue" al funcionario, no al municipio.
   *
   * Coincidencia por NOMBRE (SECOP no trae cédula del supervisor) — mismo
   * disclaimer que SIRI: nombres comunes pueden mezclar dos personas
   * distintas, por eso se exige coincidencia normalizada completa, no
   * parcial.
   */
  async perfilFuncionario(nombre: string) {
    const nombreNorm = normalizar(nombre);
    if (nombreNorm.length < 4) return { nombre, totalContratos: 0, municipios: [], proveedoresFrecuentes: [], contratos: [], alerta: null };

    // Prefiltro barato con regex por el último token (apellido, normalmente
    // más distintivo) para no traer todo Mongo — la igualdad real se valida
    // después, normalizada, en memoria.
    const tokens = nombreNorm.split(' ').filter((t) => t.length >= 3);
    const tokenBusqueda = tokens[tokens.length - 1] ?? nombreNorm;
    const regex = new RegExp(tokenBusqueda, 'i');

    const candidatos = await this.contratoModel
      .find({ $or: [{ nombreSupervisor: regex }, { nombreOrdenadorDelGasto: regex }] })
      .lean<Contrato[]>();

    const contratos = candidatos.filter(
      (c) => normalizar(c.nombreSupervisor) === nombreNorm || normalizar(c.nombreOrdenadorDelGasto) === nombreNorm,
    );

    if (contratos.length === 0) {
      return { nombre, totalContratos: 0, municipios: [], proveedoresFrecuentes: [], contratos: [], alerta: null };
    }

    const municipios = new Map<string, { departamento: string; ciudad: string; contratos: number }>();
    const porProveedor = new Map<string, { nombre: string; contratos: number; valorTotal: number; municipios: Set<string> }>();
    let valorTotal = 0;
    for (const c of contratos) {
      const keyMunicipio = `${c.departamento}|||${c.ciudad}`;
      if (!municipios.has(keyMunicipio)) municipios.set(keyMunicipio, { departamento: c.departamento, ciudad: c.ciudad, contratos: 0 });
      municipios.get(keyMunicipio)!.contratos++;

      const keyProveedor = c.nitProveedor || c.proveedorAdjudicado;
      if (keyProveedor) {
        if (!porProveedor.has(keyProveedor)) porProveedor.set(keyProveedor, { nombre: c.proveedorAdjudicado, contratos: 0, valorTotal: 0, municipios: new Set() });
        const entry = porProveedor.get(keyProveedor)!;
        entry.contratos++;
        entry.valorTotal += valorPlausible(c.valorDelContrato);
        entry.municipios.add(c.ciudad);
      }
      valorTotal += valorPlausible(c.valorDelContrato);
    }

    const proveedoresFrecuentes = [...porProveedor.values()]
      .map((p) => ({ nombre: p.nombre, contratos: p.contratos, valorTotal: p.valorTotal, municipios: [...p.municipios] }))
      .sort((a, b) => b.contratos - a.contratos)
      .slice(0, 10);

    const municipiosList = [...municipios.values()];
    // La señal fuerte: un proveedor que aparece en 2+ municipios DISTINTOS bajo el mismo funcionario.
    const proveedorMultiMunicipio = proveedoresFrecuentes.find((p) => p.municipios.length >= 2);
    const alerta =
      municipiosList.length >= 2 && proveedorMultiMunicipio
        ? `${nombre} aparece como supervisor/ordenador del gasto en ${municipiosList.length} municipios distintos, y el proveedor "${proveedorMultiMunicipio.nombre}" lo acompaña en ${proveedorMultiMunicipio.municipios.length} de ellos (${proveedorMultiMunicipio.municipios.join(', ')}) — posible red que sigue al funcionario, no al municipio.`
        : null;

    return {
      nombre,
      totalContratos: contratos.length,
      valorTotal,
      municipios: municipiosList,
      proveedoresFrecuentes,
      contratos: contratos.slice(0, 30).map((c) => ({
        idContrato: c.idContrato,
        nombreEntidad: c.nombreEntidad,
        ciudad: c.ciudad,
        departamento: c.departamento,
        objetoDelContrato: c.objetoDelContrato,
        proveedorAdjudicado: c.proveedorAdjudicado,
        valorDelContrato: c.valorDelContrato,
        fechaDeFirma: c.fechaDeFirma,
        urlProceso: c.urlProceso,
      })),
      alerta,
    };
  }

  /**
   * Busca si la pregunta menciona a una persona que aparece como
   * representante legal/ordenador del gasto/supervisor en los contratos ya
   * filtrados — y si la encuentra, arma una respuesta puntual sobre ella.
   * Existe porque el LLM es OPCIONAL (sin API key configurada, que es el
   * caso por defecto de este repo) y sin esto una pregunta del tipo
   * "¿cuántos contratos ha tenido Fulano?" caía siempre en el resumen
   * genérico del territorio, ignorando la pregunta — bug real reportado.
   * No requiere LLM: es determinístico, mismo umbral de coincidencia
   * (3+ palabras de 4+ letras) que ya se usa en SIRI/SIGEP para evitar
   * falsos positivos por un solo apellido común.
   */
  private async buscarRespuestaPorPersona(pregunta: string, contratos: Contrato[]): Promise<string | null> {
    const tokensPregunta = new Set(normalizar(pregunta).split(' ').filter((t) => t.length >= 4));
    if (tokensPregunta.size < 2) return null;

    const coincidencias = contratos.filter((c) => {
      for (const nombre of [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto, c.nombreSupervisor]) {
        if (!nombre) continue;
        const tokensNombre = new Set(normalizar(nombre).split(' ').filter((t) => t.length >= 4));
        if (tokensNombre.size === 0) continue;
        const compartidos = [...tokensPregunta].filter((t) => tokensNombre.has(t)).length;
        if (compartidos >= Math.min(3, tokensNombre.size) && compartidos >= 2) return true;
      }
      return false;
    });
    if (coincidencias.length === 0) return null;

    const valorTotal = coincidencias.reduce((s, c) => s + valorPlausible(c.valorDelContrato), 0);
    const entidades = [...new Set(coincidencias.map((c) => c.nombreEntidad))];

    const datosPersona = {
      totalContratos: coincidencias.length,
      valorTotal,
      entidades,
      contratos: coincidencias.slice(0, 15).map((c) => ({
        entidad: c.nombreEntidad,
        objeto: (c.objetoDelContrato || '').slice(0, 120),
        valor: c.valorDelContrato,
        proveedor: c.proveedorAdjudicado,
        rol: c.nombreOrdenadorDelGasto && normalizar(c.nombreOrdenadorDelGasto).split(' ').filter(t => t.length >= 4).some(t => tokensPregunta.has(t)) ? 'ordenador del gasto'
          : c.nombreSupervisor && normalizar(c.nombreSupervisor).split(' ').filter(t => t.length >= 4).some(t => tokensPregunta.has(t)) ? 'supervisor'
          : 'representante legal',
      })),
    };

    const textoFallback =
      `Encontré ${coincidencias.length} contrato(s) donde esa persona aparece como firmante, ordenador del gasto o supervisor, por un total de ${formatearPesos(valorTotal)}, en: ${entidades.join(', ')}.\n\n` +
      coincidencias.slice(0, 5).map((c) => `- ${c.nombreEntidad}: ${(c.objetoDelContrato || '').slice(0, 80)} (${formatearPesos(c.valorDelContrato)})`).join('\n') +
      '\n\n(Coincidencia por nombre, no por cédula — SECOP no la trae — confirma que es la misma persona antes de sacar conclusiones.)';

    try {
      const raw = await completar({
        system: `Eres el asistente cívico de RADAR. Analizas datos REALES de contratación pública.

REGLAS:
- SOLO menciona datos del JSON proporcionado. NUNCA inventes.
- Analiza patrones: ¿en cuántas entidades aparece? ¿qué roles tiene? ¿hay concentración de valor?
- Aclara SIEMPRE que es coincidencia por nombre, no identidad verificada.
- Tono cercano, 2-4 frases. Abreviar cifras: >= 1B → "$1,89 B", >= 1M → "$187 M".
- Responde SOLO texto plano, sin JSON ni markdown.`,
        prompt: `Pregunta: "${pregunta}"\n\nDatos reales de la base de datos: ${JSON.stringify(datosPersona)}`,
        maxTokens: 300,
      });
      return raw?.trim() || textoFallback;
    } catch {
      return textoFallback;
    }
  }

  /**
   * Filtra los contratos por las palabras (+ sinónimos) de la PREGUNTA
   * completa, no de `tema` — porque `tema` llega vacío desde el frontend
   * (se dejó así a propósito para no repetir el bug de usar la pregunta
   * completa como filtro de texto y matchear cero cuando preguntan por una
   * persona). `palabrasConSinonimos` ya descarta palabras de 2 letras o
   * menos (conectores como "el", "la", "en"), así que pasarle la pregunta
   * completa es seguro: las palabras de contenido (p.ej. "vias") se
   * expanden con sinónimos reales de SECOP, las demás simplemente no
   * matchean nada y no rompen el OR. Solo se usa el resultado si de verdad
   * acota algo (ni 0 ni el 100% de los contratos) — si no, se asume que la
   * pregunta no es sobre un tema puntual y se deja el resumen general.
   */
  private filtrarPorTemaDePregunta(pregunta: string, contratos: Contrato[]): Contrato[] | null {
    const palabras = palabrasConSinonimos(pregunta);
    if (!palabras.length) return null;
    const regex = new RegExp(palabras.join('|'), 'i');
    const filtrados = contratos.filter((c) => regex.test(c.textoNormalizado || ''));
    if (filtrados.length === 0 || filtrados.length === contratos.length) return null;
    return filtrados;
  }

  /**
   * Si hay ANTHROPIC_API_KEY/OPENAI_API_KEY configurada, redacta con IA
   * (llamada directa, ver lib/llm.ts); si no, usa una plantilla simple.
   *
   * Antes solo se le pasaba el RESUMEN agregado al LLM — si la pregunta
   * mencionaba una persona o entidad puntual ("¿cuántos contratos ha
   * tenido Fulano de Tal?"), no había forma de contestar porque esos
   * datos no estaban en el prompt (el nombre tampoco entra al filtro de
   * `tema`, que busca en el OBJETO del contrato, no en firmantes). Se
   * agrega una muestra real de contratos con nombres de firmantes/
   * ordenador del gasto/supervisor para que el LLM pueda buscar ahí — y,
   * antes que nada, se intenta una respuesta determinística por nombre
   * (buscarRespuestaPorPersona) y por tema (filtrarPorTemaDePregunta), que
   * no dependen de que haya LLM configurado.
   */
  private async redactarRespuesta(input: ConsultaInput, resumen: Record<string, unknown>, hallazgos: Hallazgo[], contratos: Contrato[]): Promise<string> {
    const respuestaPorPersona = await this.buscarRespuestaPorPersona(input.pregunta, contratos);
    if (respuestaPorPersona) return respuestaPorPersona;

    const contratosDelTema = this.filtrarPorTemaDePregunta(input.pregunta, contratos);
    if (contratosDelTema) {
      const valorTema = contratosDelTema.reduce((s, c) => s + valorPlausible(c.valorDelContrato), 0);
      const proveedoresTema = new Set(contratosDelTema.map((c) => c.nitProveedor || c.proveedorAdjudicado)).size;
      const topProveedoresTema = [...contratosDelTema.reduce((m, c) => {
        const key = c.nitProveedor || c.proveedorAdjudicado;
        if (!key) return m;
        if (!m.has(key)) m.set(key, { nombre: c.proveedorAdjudicado, valor: 0, contratos: 0 });
        const e = m.get(key)!;
        e.valor += c.valorDelContrato || 0;
        e.contratos++;
        return m;
      }, new Map<string, { nombre: string; valor: number; contratos: number }>()).values()]
        .sort((a, b) => b.valor - a.valor).slice(0, 5);

      const datosTema = {
        territorio: resumen.territorio,
        totalFiltrados: contratosDelTema.length,
        totalTerritorio: resumen.totalContratos,
        valorTema,
        proveedoresTema,
        topProveedores: topProveedoresTema,
      };
      const textoFallback = `Sobre eso específicamente, en ${resumen.territorio} encontré ${contratosDelTema.length} contrato(s) relacionados por un total de ${formatearPesos(valorTema)}, con ${proveedoresTema} proveedor(es) — de los ${resumen.totalContratos} contratos totales del territorio.`;

      try {
        const raw = await completar({
          system: `Eres el asistente cívico de RADAR. Analizas datos REALES de contratación pública.

REGLAS:
- SOLO menciona datos del JSON. NUNCA inventes.
- El usuario preguntó por un tema específico — estos son los contratos que coinciden.
- Resalta qué proporción del total representa, si hay concentración de proveedores.
- Tono cercano, 2-4 frases. Abreviar cifras. Texto plano, sin JSON ni markdown.`,
          prompt: `Pregunta: "${input.pregunta}"\n\nDatos reales: ${JSON.stringify(datosTema)}`,
          maxTokens: 300,
        });
        return raw?.trim() || textoFallback;
      } catch {
        return textoFallback;
      }
    }

    const plantilla = () =>
      `En ${resumen.territorio}${input.tema ? `, sobre "${input.tema}",` : ''} encontramos ${resumen.totalContratos} contratos por un total de ${formatearPesos(Number(resumen.valorTotalContratado))} con ${resumen.proveedoresUnicos} proveedores distintos.` +
      (hallazgos.length ? ` Encontramos ${hallazgos.length} aspecto(s) que pueden ser relevantes para una veeduría.` : ' No se detectaron patrones inusuales con los datos disponibles.');

    const muestraContratos = contratos.slice(0, 40).map((c) => ({
      entidad: c.nombreEntidad,
      objeto: (c.objetoDelContrato || '').slice(0, 100),
      proveedor: c.proveedorAdjudicado,
      valor: c.valorDelContrato,
      representanteLegal: c.nombreRepresentanteLegal,
      ordenadorDelGasto: c.nombreOrdenadorDelGasto,
      supervisor: c.nombreSupervisor,
    }));

    try {
      const respuesta = await completar({
        system:
          'Eres el asistente cívico de RADAR. Respondes en español, en 3-5 frases, tono claro para un ciudadano sin conocimientos técnicos de contratación pública. Básate SOLO en los datos que te dan, no inventes cifras. Si la pregunta menciona una persona o entidad puntual, búscala en la lista de contratos (campos representanteLegal/ordenadorDelGasto/supervisor/proveedor/entidad) y responde específicamente sobre ella; si no aparece en la muestra que tienes, dilo explícitamente en vez de responder con el resumen general.',
        prompt: `Pregunta del ciudadano: "${input.pregunta}"\n\nDatos agregados: ${JSON.stringify(resumen)}\n\nHallazgos detectados: ${JSON.stringify(hallazgos.map((h) => ({ titulo: h.titulo, detalle: h.detalle })))}\n\nMuestra de contratos (hasta 40, del total sincronizado): ${JSON.stringify(muestraContratos)}`,
        maxTokens: 350,
      });
      return respuesta ?? plantilla();
    } catch (err) {
      this.logger.warn(`No se pudo redactar con IA: ${(err as Error).message}`);
      return plantilla();
    }
  }
}
