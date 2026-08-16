import { useEffect, useMemo, useState } from 'react';
import { COLOMBIA_LOCATIONS } from '../../colombiaCoords';
import { obtenerDatosMapa } from '../../services/map.service';
import type { MapRiskFilter, MapRiskPoint, UseMapRiskReturn } from '../../types/map.types';

const ALL_DEPARTMENTS = 'Todos los departamentos';

const DEPARTMENT_ALIASES: Record<string, string> = {
  'distrito capital de bogotá': 'Bogotá, D.c.',
};

function getCoordinates(department: string, city: string): { lat: number; lng: number } | null {
  const normalizedDepartment = DEPARTMENT_ALIASES[department.toLowerCase()] ?? department;
  const locations = COLOMBIA_LOCATIONS[normalizedDepartment];
  if (!locations) return null;

  const match = locations.find((location) => location.name.localeCompare(city, 'es', { sensitivity: 'base' }) === 0);
  return match ? { lat: match.lat, lng: match.lng } : null;
}

function matchesRiskFilter(concentration: number, filter: MapRiskFilter): boolean {
  if (filter === 'high') return concentration >= 80;
  if (filter === 'medium') return concentration >= 50 && concentration < 80;
  if (filter === 'low') return concentration < 50;
  return true;
}

export function colorForRisk(concentration: number): string {
  if (concentration >= 80) return '#d85b52';
  if (concentration >= 50) return '#d99b39';
  return '#4c9b68';
}

export function radiusForContracts(totalContracts: number): number {
  return Math.max(7, Math.min(27, 6 + totalContracts * 1.4));
}

export default function useMapaRiesgo(): UseMapRiskReturn {
  const [rawPoints, setRawPoints] = useState<MapRiskPoint[]>([]);
  const [department, setDepartment] = useState(ALL_DEPARTMENTS);
  const [riskFilter, setRiskFilter] = useState<MapRiskFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerDatosMapa()
      .then((data) => {
        const points = data
          .map((item) => {
            const coordinates = getCoordinates(item.departamento, item.ciudad);
            return coordinates ? { ...item, ...coordinates } : null;
          })
          .filter((point): point is MapRiskPoint => point !== null);
        setRawPoints(points);
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const departments = useMemo(
    () => [ALL_DEPARTMENTS, ...Array.from(new Set(rawPoints.map((point) => point.departamento))).sort()],
    [rawPoints],
  );

  const points = useMemo(
    () => rawPoints.filter(
      (point) => (department === ALL_DEPARTMENTS || point.departamento === department)
        && matchesRiskFilter(point.concentracionProveedores, riskFilter),
    ),
    [department, rawPoints, riskFilter],
  );

  return {
    department,
    riskFilter,
    departments,
    points,
    totalContracts: points.reduce((total, point) => total + point.totalContratos, 0),
    totalValue: points.reduce((total, point) => total + point.valorTotal, 0),
    municipalityCount: points.length,
    isLoading,
    error,
    setDepartment,
    setRiskFilter,
  };
}
