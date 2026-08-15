import { useMemo, useState } from 'react';

import { radarService } from './services/radar.service';
import { DEPARTMENTS, MUNICIPALITIES, PUBLIC_OFFICIALS, SEARCH_EXAMPLES, VIEWS } from './constants';
import colombia from './colombia.json';

export function useRadarApp() {
  const [activeView, setActiveView] = useState(VIEWS.HOME);
  const [query, setQuery] = useState('Proximas ayudas en Quibdo, Choco');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);
  const [sigepMatches, setSigepMatches] = useState({});
  const [sigepStatus, setSigepStatus] = useState('idle');
  const [sigepError, setSigepError] = useState('');

  // Selector propio para la ficha territorial: usa el listado completo de
  // departamentos/municipios (colombia.json, todo el pais) en vez del
  // listado corto de ejemplo (DEPARTMENTS/MUNICIPALITIES) que usa el resto
  // del mockup, porque necesita coincidir con nombres reales de SECOP/CUIPO.
  const [fichaDepartamento, setFichaDepartamento] = useState('Cundinamarca');
  const [fichaMunicipio, setFichaMunicipio] = useState('Tocancipá');
  const fichaMunicipiosDisponibles = useMemo(
    () => colombia.find((d) => d.departamento === fichaDepartamento)?.ciudades ?? [],
    [fichaDepartamento],
  );
  const [ficha, setFicha] = useState(null);
  const [fichaStatus, setFichaStatus] = useState('idle');
  const [fichaError, setFichaError] = useState('');

  function setFichaDepartamentoYMunicipio(nuevoDepartamento) {
    setFichaDepartamento(nuevoDepartamento);
    setFichaMunicipio(colombia.find((d) => d.departamento === nuevoDepartamento)?.ciudades[0] ?? '');
  }

  async function handleCargarFicha() {
    setFichaStatus('loading');
    setFichaError('');
    setFicha(null);
    try {
      const data = await radarService.obtenerFichaTerritorial(fichaDepartamento, fichaMunicipio);
      setFicha(data);
      setFichaStatus('success');
    } catch (error) {
      setFichaStatus('error');
      setFichaError(error.message);
    }
  }

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
    // Ficha territorial (datos reales)
    ficha,
    fichaStatus,
    fichaError,
    fichaDepartamento,
    fichaMunicipio,
    fichaMunicipiosDisponibles,
    departamentosColombia: colombia,
    setFichaDepartamento: setFichaDepartamentoYMunicipio,
    setFichaMunicipio,
    handleCargarFicha,
  };
}
