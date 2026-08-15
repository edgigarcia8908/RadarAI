import { useMemo, useState } from 'react';

import { radarService } from './services/radar.service';
import { DEPARTMENTS, MUNICIPALITIES, PUBLIC_OFFICIALS, SEARCH_EXAMPLES, VIEWS } from './constants';
import colombia from './colombia.json';

function haceUnAno() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Selector de departamento/municipio contra el listado COMPLETO del pais
 * (colombia.json) — a diferencia de DEPARTMENTS/MUNICIPALITIES (7 items de
 * ejemplo que usa el buscador del home), este es el que necesitan los
 * modulos con datos reales para coincidir con nombres reales de
 * SECOP/CUIPO/SGR.
 */
function useMunicipioPicker(departamentoInicial, municipioInicial) {
  const [departamento, setDepartamentoBase] = useState(departamentoInicial);
  const [municipio, setMunicipio] = useState(municipioInicial);
  const municipiosDisponibles = useMemo(
    () => colombia.find((d) => d.departamento === departamento)?.ciudades ?? [],
    [departamento],
  );

  function setDepartamento(nuevoDepartamento) {
    setDepartamentoBase(nuevoDepartamento);
    setMunicipio(colombia.find((d) => d.departamento === nuevoDepartamento)?.ciudades[0] ?? '');
  }

  return { departamento, municipio, municipiosDisponibles, setDepartamento, setMunicipio };
}

export function useRadarApp() {
  const [activeView, setActiveView] = useState(VIEWS.HOME);
  const [query, setQuery] = useState('Proximas ayudas en Quibdo, Choco');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);
  const [sigepMatches, setSigepMatches] = useState({});
  const [sigepStatus, setSigepStatus] = useState('idle');
  const [sigepError, setSigepError] = useState('');

  const searchContext = useMemo(
    () => radarService.buildSearchContext({ query, department, municipality }),
    [query, department, municipality],
  );

  function handleSearchSubmit(event) {
    event.preventDefault();
    setActiveView(VIEWS.CITIZEN);
  }

  function handleExampleClick(example) {
    setQuery(example);
  }

  function handleNavigate(view) {
    setActiveView(view);
  }

  async function handleVerifySigep() {
    setSigepStatus('loading');
    setSigepError('');

    try {
      const nombres = PUBLIC_OFFICIALS.map((official) => official.name);
      const matches = await radarService.verificarSigep(nombres);
      setSigepMatches(matches);
      setSigepStatus('success');
    } catch (error) {
      setSigepMatches({});
      setSigepStatus('error');
      setSigepError(error.message);
    }
  }

  // ---------------------------------------------------------------------
  // Ficha territorial (datos reales)
  // ---------------------------------------------------------------------
  const fichaPicker = useMunicipioPicker('Cundinamarca', 'Tocancipá');
  const [ficha, setFicha] = useState(null);
  const [fichaStatus, setFichaStatus] = useState('idle');
  const [fichaError, setFichaError] = useState('');

  async function handleCargarFicha() {
    setFichaStatus('loading');
    setFichaError('');
    setFicha(null);
    try {
      const data = await radarService.obtenerFichaTerritorial(fichaPicker.departamento, fichaPicker.municipio);
      setFicha(data);
      setFichaStatus('success');
    } catch (error) {
      setFichaStatus('error');
      setFichaError(error.message);
    }
  }

  // ---------------------------------------------------------------------
  // Ciudadania: Vigilar mi territorio (datos reales)
  // ---------------------------------------------------------------------
  const citizenPicker = useMunicipioPicker('Cundinamarca', 'Tocancipá');
  const [citizenTema, setCitizenTema] = useState('mantenimiento de colegios');
  const [citizenPregunta, setCitizenPregunta] = useState('¿Cuánto ha gastado el municipio en mantenimiento de colegios este año?');
  const [citizenFechaDesde, setCitizenFechaDesde] = useState(haceUnAno());
  const [citizenFechaHasta, setCitizenFechaHasta] = useState(hoy());
  const [citizenSyncStatus, setCitizenSyncStatus] = useState('idle');
  const [citizenSyncInfo, setCitizenSyncInfo] = useState('');
  const [citizenConsultaStatus, setCitizenConsultaStatus] = useState('idle');
  const [citizenError, setCitizenError] = useState('');
  const [citizenResultado, setCitizenResultado] = useState(null);
  const [citizenPresupuesto, setCitizenPresupuesto] = useState(null);
  const [citizenSanciones, setCitizenSanciones] = useState({});
  const [citizenPuestosSensibles, setCitizenPuestosSensibles] = useState({});

  async function handleSincronizarCitizen() {
    setCitizenSyncStatus('loading');
    setCitizenError('');
    try {
      const r = await radarService.sincronizar({
        departamento: citizenPicker.departamento,
        ciudad: citizenPicker.municipio,
        tema: citizenTema,
        fechaDesde: citizenFechaDesde,
        fechaHasta: citizenFechaHasta,
      });
      setCitizenSyncInfo(`Traidos de SECOP (${citizenFechaDesde} a ${citizenFechaHasta}): ${r.procesos} procesos, ${r.contratos} contratos.`);
      setCitizenSyncStatus('success');
    } catch (error) {
      setCitizenSyncStatus('error');
      setCitizenError(error.message);
    }
  }

  async function handleConsultarCitizen() {
    setCitizenConsultaStatus('loading');
    setCitizenError('');
    setCitizenResultado(null);
    setCitizenPresupuesto(null);
    setCitizenSanciones({});
    setCitizenPuestosSensibles({});
    try {
      const r = await radarService.consultar({
        departamento: citizenPicker.departamento,
        ciudad: citizenPicker.municipio,
        tema: citizenTema,
        pregunta: citizenPregunta,
        fechaDesde: citizenFechaDesde,
        fechaHasta: citizenFechaHasta,
      });
      setCitizenResultado(r);
      setCitizenConsultaStatus('success');

      const nombresFirmantes = [...new Set(r.evidenciaContratos.flatMap((c) => [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto]).filter(Boolean))];
      radarService.verificarSiri(nombresFirmantes).then(setCitizenSanciones).catch(() => {});
      const nombresServidores = [...new Set(r.evidenciaContratos.flatMap((c) => [c.nombreOrdenadorDelGasto, c.nombreSupervisor]).filter(Boolean))];
      radarService.verificarSigep(nombresServidores).then(setCitizenPuestosSensibles).catch(() => {});
    } catch (error) {
      setCitizenConsultaStatus('error');
      setCitizenError(error.message);
    }

    try {
      setCitizenPresupuesto(
        await radarService.obtenerPresupuestoCuipo({
          departamento: citizenPicker.departamento,
          ciudad: citizenPicker.municipio,
          fechaDesde: citizenFechaDesde,
          fechaHasta: citizenFechaHasta,
        }),
      );
    } catch {
      // silencioso: CUIPO es un extra, no bloquea el flujo principal
    }
  }

  // ---------------------------------------------------------------------
  // Empresas: Encontrar oportunidades (datos reales)
  // ---------------------------------------------------------------------
  const empresaPicker = useMunicipioPicker('Cundinamarca', 'Tocancipá');
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaProductos, setEmpresaProductos] = useState(
    'Vendemos computadores empresariales, servidores y soluciones de infraestructura tecnológica.',
  );
  const [empresaFechaDesde, setEmpresaFechaDesde] = useState(haceUnAno());
  const [empresaFechaHasta, setEmpresaFechaHasta] = useState(hoy());
  const [empresaStatus, setEmpresaStatus] = useState('idle');
  const [empresaError, setEmpresaError] = useState('');
  const [empresaSyncInfo, setEmpresaSyncInfo] = useState('');
  const [empresaPerfil, setEmpresaPerfil] = useState(null);
  const [oportunidades, setOportunidades] = useState(null);

  async function handleBuscarOportunidades() {
    setEmpresaStatus('loading');
    setEmpresaError('');
    setOportunidades(null);
    try {
      // 1. Crea (o re-crea) el perfil de la empresa — genera palabrasClave automaticamente.
      const emp = await radarService.crearEmpresa({
        nombre: empresaNombre,
        productosServicios: empresaProductos,
        departamentos: [empresaPicker.departamento],
      });
      setEmpresaPerfil(emp);

      // 2. Trae procesos abiertos recientes del departamento (mismo dataset que Ciudadania).
      const r = await radarService.sincronizar({
        departamento: empresaPicker.departamento,
        fechaDesde: empresaFechaDesde,
        fechaHasta: empresaFechaHasta,
      });
      setEmpresaSyncInfo(`Procesos revisados en ${empresaPicker.departamento} (${empresaFechaDesde} a ${empresaFechaHasta}): ${r.procesos}.`);

      // 3. Calcula compatibilidad contra los procesos ya sincronizados.
      const ops = await radarService.oportunidadesParaEmpresa(emp._id);
      setOportunidades(ops);
      setEmpresaStatus('success');
    } catch (error) {
      setEmpresaStatus('error');
      setEmpresaError(error.message);
    }
  }

  // ---------------------------------------------------------------------
  // Mapa de riesgo (datos reales)
  // ---------------------------------------------------------------------
  const [mapaDatos, setMapaDatos] = useState([]);
  const [mapaStatus, setMapaStatus] = useState('idle');
  const [mapaError, setMapaError] = useState('');

  async function handleCargarMapa() {
    setMapaStatus('loading');
    setMapaError('');
    try {
      const datos = await radarService.obtenerMapaRiesgo();
      setMapaDatos(datos);
      setMapaStatus('success');
    } catch (error) {
      setMapaStatus('error');
      setMapaError(error.message);
    }
  }

  // ---------------------------------------------------------------------
  // Estudio de mercado (datos reales)
  // ---------------------------------------------------------------------
  const marketPicker = useMunicipioPicker('Cundinamarca', 'Tocancipá');
  const [marketObjeto, setMarketObjeto] = useState('mantenimiento de vías');
  const [marketFechaDesde, setMarketFechaDesde] = useState(haceUnAno());
  const [marketFechaHasta, setMarketFechaHasta] = useState(hoy());
  const [marketStatus, setMarketStatus] = useState('idle');
  const [marketError, setMarketError] = useState('');
  const [marketEstudio, setMarketEstudio] = useState(null);

  async function handleGenerarEstudio() {
    setMarketStatus('loading');
    setMarketError('');
    setMarketEstudio(null);
    try {
      const estudio = await radarService.generarEstudioMercado({
        objeto: marketObjeto,
        departamento: marketPicker.departamento,
        ciudad: marketPicker.municipio,
        fechaDesde: marketFechaDesde,
        fechaHasta: marketFechaHasta,
      });
      setMarketEstudio(estudio);
      setMarketStatus('success');
    } catch (error) {
      setMarketStatus('error');
      setMarketError(error.message);
    }
  }

  // ---------------------------------------------------------------------
  // Veedurias (datos reales)
  // ---------------------------------------------------------------------
  const [veedurias, setVeedurias] = useState([]);
  const [veeduriasStatus, setVeeduriasStatus] = useState('idle');
  const [veeduriaActivaId, setVeeduriaActivaId] = useState(null);
  const [veeduriaActiva, setVeeduriaActiva] = useState(null);
  const [veeduriaEvidencia, setVeeduriaEvidencia] = useState(null);
  const [veeduriaError, setVeeduriaError] = useState('');
  const [veeduriaAutor, setVeeduriaAutor] = useState('');
  const [veeduriaComentario, setVeeduriaComentario] = useState('');
  const [veeduriaPregunta, setVeeduriaPregunta] = useState('');
  const [veeduriaRespuesta, setVeeduriaRespuesta] = useState('');
  const [veeduriaPreguntando, setVeeduriaPreguntando] = useState(false);
  const [veeduriaSubiendo, setVeeduriaSubiendo] = useState(false);

  async function handleCargarVeedurias() {
    setVeeduriasStatus('loading');
    setVeeduriaError('');
    try {
      setVeedurias(await radarService.listarVeedurias());
      setVeeduriasStatus('success');
    } catch (error) {
      setVeeduriasStatus('error');
      setVeeduriaError(error.message);
    }
  }

  async function handleAbrirVeeduria(id) {
    setVeeduriaActivaId(id);
    if (!id) {
      setVeeduriaActiva(null);
      setVeeduriaEvidencia(null);
      return;
    }
    try {
      setVeeduriaActiva(await radarService.obtenerVeeduria(id));
      const ev = await radarService.obtenerEvidenciaDetalle(id);
      setVeeduriaEvidencia(ev);
      const nombres = [...new Set(ev.contratos.flatMap((c) => [c.nombreRepresentanteLegal, c.nombreOrdenadorDelGasto]).filter(Boolean))];
      radarService.verificarSiri(nombres).then(setCitizenSanciones).catch(() => {});
    } catch (error) {
      setVeeduriaError(error.message);
    }
  }

  async function handleCrearVeeduria(titulo) {
    try {
      const v = await radarService.crearVeeduria({ titulo, tema: citizenTema, departamento: citizenPicker.departamento, ciudad: citizenPicker.municipio });
      await handleCargarVeedurias();
      handleAbrirVeeduria(v._id);
      handleNavigate(VIEWS.OVERSIGHT);
    } catch (error) {
      setVeeduriaError(error.message);
    }
  }

  async function handleComentarVeeduria() {
    if (!veeduriaComentario.trim() || !veeduriaAutor.trim() || !veeduriaActivaId) return;
    await radarService.agregarComentario(veeduriaActivaId, veeduriaAutor, veeduriaComentario);
    setVeeduriaComentario('');
    handleAbrirVeeduria(veeduriaActivaId);
  }

  async function handleChecklistVeeduria(indice, hecho) {
    if (!veeduriaActivaId) return;
    await radarService.marcarChecklist(veeduriaActivaId, indice, hecho);
    handleAbrirVeeduria(veeduriaActivaId);
  }

  async function handleSubirDocumentoVeeduria(file) {
    if (!veeduriaActivaId || !file) return;
    setVeeduriaSubiendo(true);
    try {
      await radarService.subirDocumento(veeduriaActivaId, file, veeduriaAutor || 'anónimo');
      await handleAbrirVeeduria(veeduriaActivaId);
    } catch (error) {
      setVeeduriaError(error.message);
    } finally {
      setVeeduriaSubiendo(false);
    }
  }

  async function handlePreguntarVeeduria() {
    if (!veeduriaPregunta.trim() || !veeduriaActivaId) return;
    setVeeduriaPreguntando(true);
    setVeeduriaRespuesta('');
    try {
      const r = await radarService.preguntarSobreDocumentos(veeduriaActivaId, veeduriaPregunta);
      setVeeduriaRespuesta(r.answer);
    } catch (error) {
      setVeeduriaRespuesta(`Error: ${error.message}`);
    } finally {
      setVeeduriaPreguntando(false);
    }
  }

  return {
    activeView,
    departments: DEPARTMENTS,
    examples: SEARCH_EXAMPLES,
    municipality,
    municipalities: MUNICIPALITIES,
    query,
    searchContext,
    selectedDepartment: department,
    sigepError,
    sigepMatches,
    sigepStatus,
    handleExampleClick,
    handleNavigate,
    handleSearchSubmit,
    handleVerifySigep,
    setDepartment,
    setMunicipality,
    setQuery,
    departamentosColombia: colombia,

    // Ficha territorial
    ficha,
    fichaStatus,
    fichaError,
    fichaDepartamento: fichaPicker.departamento,
    fichaMunicipio: fichaPicker.municipio,
    fichaMunicipiosDisponibles: fichaPicker.municipiosDisponibles,
    setFichaDepartamento: fichaPicker.setDepartamento,
    setFichaMunicipio: fichaPicker.setMunicipio,
    handleCargarFicha,

    // Ciudadania
    citizenDepartamento: citizenPicker.departamento,
    citizenMunicipio: citizenPicker.municipio,
    citizenMunicipiosDisponibles: citizenPicker.municipiosDisponibles,
    setCitizenDepartamento: citizenPicker.setDepartamento,
    setCitizenMunicipio: citizenPicker.setMunicipio,
    citizenTema,
    setCitizenTema,
    citizenPregunta,
    setCitizenPregunta,
    citizenFechaDesde,
    setCitizenFechaDesde,
    citizenFechaHasta,
    setCitizenFechaHasta,
    citizenSyncStatus,
    citizenSyncInfo,
    citizenConsultaStatus,
    citizenError,
    citizenResultado,
    citizenPresupuesto,
    citizenSanciones,
    citizenPuestosSensibles,
    handleSincronizarCitizen,
    handleConsultarCitizen,
    handleCrearVeeduria,

    // Empresas
    empresaDepartamento: empresaPicker.departamento,
    setEmpresaDepartamento: empresaPicker.setDepartamento,
    empresaNombre,
    setEmpresaNombre,
    empresaProductos,
    setEmpresaProductos,
    empresaFechaDesde,
    setEmpresaFechaDesde,
    empresaFechaHasta,
    setEmpresaFechaHasta,
    empresaStatus,
    empresaError,
    empresaSyncInfo,
    empresaPerfil,
    oportunidades,
    handleBuscarOportunidades,

    // Mapa de riesgo
    mapaDatos,
    mapaStatus,
    mapaError,
    handleCargarMapa,

    // Estudio de mercado
    marketDepartamento: marketPicker.departamento,
    marketMunicipio: marketPicker.municipio,
    marketMunicipiosDisponibles: marketPicker.municipiosDisponibles,
    setMarketDepartamento: marketPicker.setDepartamento,
    setMarketMunicipio: marketPicker.setMunicipio,
    marketObjeto,
    setMarketObjeto,
    marketFechaDesde,
    setMarketFechaDesde,
    marketFechaHasta,
    setMarketFechaHasta,
    marketStatus,
    marketError,
    marketEstudio,
    handleGenerarEstudio,

    // Veedurias
    veedurias,
    veeduriasStatus,
    veeduriaActivaId,
    veeduriaActiva,
    veeduriaEvidencia,
    veeduriaError,
    veeduriaAutor,
    setVeeduriaAutor,
    veeduriaComentario,
    setVeeduriaComentario,
    veeduriaPregunta,
    setVeeduriaPregunta,
    veeduriaRespuesta,
    veeduriaPreguntando,
    veeduriaSubiendo,
    handleCargarVeedurias,
    handleAbrirVeeduria,
    handleComentarVeeduria,
    handleChecklistVeeduria,
    handleSubirDocumentoVeeduria,
    handlePreguntarVeeduria,
  };
}
