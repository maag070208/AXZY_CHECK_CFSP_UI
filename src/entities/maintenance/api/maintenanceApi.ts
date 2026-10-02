/**
 * API de mantenimientos.
 *
 * Igual que `entities/incident`, usa `request` de `@shared/api` (nunca lanza),
 * así que los view-models no necesitan `try/catch`.
 */
import {
  post,
  put,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type { Maintenance } from "../model/types";



export const resolveMaintenance = (id: string): Promise<TResult<Maintenance>> =>
  put<Maintenance>(`/maintenance/${id}/resolve`, {});

export const deleteMaintenance = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/maintenance/${id}`);


export const fetchMaintenancesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Maintenance>> => {
  const res = await post<Paginated<Maintenance>>("/maintenance/datatable", params);
  return toTableResponse<Maintenance>(res);
};
