/**
 * API de mantenimientos.
 *
 * Igual que `entities/incident`, usa `request` de `@shared/api` (nunca lanza),
 * así que los view-models no necesitan `try/catch`.
 */
import {
  get,
  post,
  put,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type { CreateMaintenanceDto, Maintenance, MaintenanceListParams } from "../model/types";

const toQuery = (filters: MaintenanceListParams = {}): string => {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate.toISOString());
  if (filters.endDate) params.set("endDate", filters.endDate.toISOString());
  if (filters.guardId) params.set("guardId", filters.guardId);
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("title", filters.search);
  const qs = params.toString();
  return qs ? `/maintenance?${qs}` : "/maintenance";
};

export const listMaintenances = (filters?: MaintenanceListParams): Promise<TResult<Maintenance[]>> =>
  get<Maintenance[]>(toQuery(filters));

export const createMaintenance = (data: CreateMaintenanceDto): Promise<TResult<Maintenance>> =>
  post<Maintenance>("/maintenance", data);

export const resolveMaintenance = (id: string): Promise<TResult<Maintenance>> =>
  put<Maintenance>(`/maintenance/${id}/resolve`, {});

export const deleteMaintenance = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/maintenance/${id}`);

export const deleteMaintenanceMedia = (id: string, key: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/maintenance/${id}/media?key=${encodeURIComponent(key)}`);

export const fetchMaintenancesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Maintenance>> => {
  const res = await post<Paginated<Maintenance>>("/maintenance/datatable", params);
  return toTableResponse<Maintenance>(res);
};
