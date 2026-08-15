import { useMemo, useState } from 'react';

import { radarService } from './services/radar.service';
import { DEPARTMENTS, MUNICIPALITIES, PUBLIC_OFFICIALS, SEARCH_EXAMPLES, VIEWS } from './constants';

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
  };
}
