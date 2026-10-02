/**
 * API de incidencias.
 *
 * Usa `request` de `@shared/api`, que **nunca lanza**: siempre resuelve un
 * `TResult`. Eso es lo que permite que los view-models hagan `if (!res.success)`
 * sin `try/catch` (a diferencia del `core/axios` legacy, que sí lanza).
 */
import { post, put, remove, type ITDataTableFetchParams, type ITDataTableResponse, type Paginated, type TResult, toTableResponse } from "@shared/api";
import type { Incident } from "../model/types";



export const resolveIncident = (id: string): Promise<TResult<Incident>> =>
  put<Incident>(`/incidents/${id}/resolve`, {});

export const deleteIncident = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/incidents/${id}`);


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
