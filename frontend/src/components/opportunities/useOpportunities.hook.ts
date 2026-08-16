import { useState } from 'react';
import { crearEmpresa, oportunidadesParaEmpresa, sincronizar } from '../../api';
import {
  OPPORTUNITY_DEPARTMENTS,
  OPPORTUNITY_ITEMS,
  OPPORTUNITY_MUNICIPALITIES,
  OPPORTUNITY_PERIODS,
} from '../../constants/OPPORTUNITIES';
import type { OpportunityItem } from '../../types/opportunities.types';

export interface UseOpportunitiesReturn {
  companyName: string;
  offer: string;
  department: string;
  municipality: string;
  period: string;
  locationEnabled: boolean;
  items: OpportunityItem[];
  isSearching: boolean;
  searchError: string | null;
  setCompanyName: (value: string) => void;
  setOffer: (value: string) => void;
  setDepartment: (value: string) => void;
  setMunicipality: (value: string) => void;
  setPeriod: (value: string) => void;
  toggleLocation: () => void;
  handleSearch: () => Promise<void>;
}

export default function useOpportunities(): UseOpportunitiesReturn {
  const [companyName, setCompanyName] = useState('');
  const [offer, setOffer] = useState('');
  const [department, setDepartment] = useState(OPPORTUNITY_DEPARTMENTS[0]);
  const [municipality, setMunicipality] = useState(OPPORTUNITY_MUNICIPALITIES[0]);
  const [period, setPeriod] = useState(OPPORTUNITY_PERIODS[0]);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [items, setItems] = useState<OpportunityItem[]>(OPPORTUNITY_ITEMS);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function toggleLocation() {
    setLocationEnabled((current) => !current);
  }

  async function handleSearch() {
    if (!companyName.trim() || !offer.trim()) {
      setSearchError('Completa el nombre de tu empresa y lo que vendes para buscar oportunidades.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const company = await crearEmpresa({
        nombre: companyName.trim(),
        productosServicios: offer.trim(),
        departamentos: [department],
        ciudades: municipality === 'Todos' ? undefined : [municipality],
      });
      await sincronizar({
        departamento: department,
        ciudad: municipality === 'Todos' ? undefined : municipality,
      });
      const opportunities = await oportunidadesParaEmpresa(company._id);
      setItems(opportunities.length > 0 ? opportunities.map((item) => ({
        id: item.proceso.idProceso,
        title: item.proceso.nombreProcedimiento || item.proceso.descripcionProcedimiento,
        entity: item.proceso.entidad,
        competition: `Competencia estimada\\n${item.competencia.toLowerCase()}`,
        recommendation: `Recomendación\\n${item.porQue[0] ?? 'Revisa los requisitos del proceso.'}`,
        priority: item.prioridad === 'ALTA' ? 'Alta posibilidad' : 'Media posibilidad',
        icon: item.proceso.nombreProcedimiento.toLowerCase().includes('servidor') ? 'server' : item.proceso.nombreProcedimiento.toLowerCase().includes('red') ? 'network' : 'monitor',
        tone: item.prioridad === 'ALTA' ? 'purple' : 'mustard',
      })) : OPPORTUNITY_ITEMS);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'No se pudieron cargar las oportunidades.');
    } finally {
      setIsSearching(false);
    }
  }

  return {
    companyName,
    offer,
    department,
    municipality,
    period,
    locationEnabled,
    items,
    isSearching,
    searchError,
    setCompanyName,
    setOffer,
    setDepartment,
    setMunicipality,
    setPeriod,
    toggleLocation,
    handleSearch,
  };
}
