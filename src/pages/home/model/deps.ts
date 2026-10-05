/**
 * Dependencias del view-model de Inicio.
 *
 * El view-model no conoce las entidades: recibe funciones ya conectadas para
 * poder testearse con mocks. Aquí es el único punto donde `pages/home` toca
 * `entities/*` (permitido en FSD: una página sí importa entidades).
 */
import { useMemo } from "react";
import { fetchIncidentsTable, type Incident } from "@entities/incident";
import { fetchMaintenancesTable, type Maintenance } from "@entities/maintenance";
import { getCurrentRound, type Round } from "@entities/round";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
  TResult,
} from "@shared/api";

/** Filtros que entienden los datatable (`status`, `guardId`, …). */
export type HomeCountFilters = Record<string, string | number | boolean>;

export interface HomeDeps {
  /** Cuenta incidencias propias sin descargar filas (pide `limit: 1`). */
  countIncidents: (filters: HomeCountFilters) => Promise<number>;
  /** Cuenta mantenimientos propios sin descargar filas. */
  countMaintenances: (filters: HomeCountFilters) => Promise<number>;
  /** Recorrido en curso del usuario (la API ya lo acota por guardia). */
  getCurrentRound: () => Promise<TResult<Round | null>>;
}

/**
 * Reutiliza el `total` del datatable como contador: `limit: 1` trae una sola
 * fila pero el backend calcula el total global del filtro.
 */
const countBy = async <T,>(
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<T>>,
  filters: HomeCountFilters,
): Promise<number> => {
  const res = await fetchTable({ page: 1, limit: 1, filters });
  return res.total;
};

export const useHomeDeps = (): HomeDeps =>
  useMemo(
    () => ({
      countIncidents: (filters) => countBy<Incident>(fetchIncidentsTable, filters),
      countMaintenances: (filters) => countBy<Maintenance>(fetchMaintenancesTable, filters),
      getCurrentRound,
    }),
    [],
  );
