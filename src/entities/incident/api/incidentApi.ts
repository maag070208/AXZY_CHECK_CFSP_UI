/**
 * API de incidencias.
 *
 * Usa `request` de `@shared/api`, que **nunca lanza**: siempre resuelve un
 * `TResult`. Eso es lo que permite que los view-models hagan `if (!res.success)`
 * sin `try/catch` (a diferencia del `core/axios` legacy, que sí lanza).
 */
import { get, post, put, remove, type ITDataTableFetchParams, type ITDataTableResponse, type Paginated, type TResult, toTableResponse } from "@shared/api";
import type { CreateIncidentDto, Incident, IncidentListParams } from "../model/types";

/** Construye el querystring solo con los filtros presentes. */
const toQuery = (filters: IncidentListParams = {}): string => {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate.toISOString());
  if (filters.endDate) params.set("endDate", filters.endDate.toISOString());
  if (filters.guardId) params.set("guardId", filters.guardId);
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("title", filters.search);
  const qs = params.toString();
  return qs ? `/incidents?${qs}` : "/incidents";
};

export const listIncidents = (filters?: IncidentListParams): Promise<TResult<Incident[]>> =>
  get<Incident[]>(toQuery(filters));

export const createIncident = (data: CreateIncidentDto): Promise<TResult<Incident>> =>
  post<Incident>("/incidents", data);

export const resolveIncident = (id: string): Promise<TResult<Incident>> =>
  put<Incident>(`/incidents/${id}/resolve`, {});

export const deleteIncident = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/incidents/${id}`);

export const deleteIncidentMedia = (id: string, key: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/incidents/${id}/media?key=${encodeURIComponent(key)}`);

/**
 * Página de la tabla. El backend responde `{ rows, total }`; `toTableResponse`
 * lo convierte a `{ data, total }`, que es lo que `ITDataTable` espera.
 */
export const fetchIncidentsTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Incident>> => {
  const res = await post<Paginated<Incident>>("/incidents/datatable", params);
  return toTableResponse<Incident>(res);
};
