import { useState } from 'react';
import {
  COMPARE_DEPARTMENTS,
  COMPARE_MUNICIPALITIES,
  COMPARE_PERIODS,
} from '../../constants/COMPARE_PROVIDERS';

export interface UseCompareProvidersReturn {
  service: string;
  department: string;
  municipality: string;
  period: string;
  setService: (value: string) => void;
  setDepartment: (value: string) => void;
  setMunicipality: (value: string) => void;
  setPeriod: (value: string) => void;
  handleCompare: () => void;
}

export default function useCompareProviders(): UseCompareProvidersReturn {
  const [service, setService] = useState('');
  const [department, setDepartment] = useState(COMPARE_DEPARTMENTS[0]);
  const [municipality, setMunicipality] = useState(COMPARE_MUNICIPALITIES[0]);
  const [period, setPeriod] = useState(COMPARE_PERIODS[0]);

  function handleCompare() {
    setService((current) => current.trim());
  }

  return {
    service,
    department,
    municipality,
    period,
    setService,
    setDepartment,
    setMunicipality,
    setPeriod,
    handleCompare,
  };
}
