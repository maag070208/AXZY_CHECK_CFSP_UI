/**
 * API de Kardex. `request` de `@shared/api` nunca lanza.
 *
 * Nota: `/kardex/datatable` es el endpoint que responde `{ data, total }` en
 * lugar de `{ rows, total }`; `toTableResponse` acepta ambas formas.
 */
import {
  get,
  post,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type { KardexEntry } from "../model/types";

export type KardexFilter = {
  userId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
};

const toQuery = (filters: KardexFilter = {}): string => {
  const params = new URLSearchParams();
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.locationId) params.set("locationId", filters.locationId);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  const qs = params.toString();
  return qs ? `/kardex?${qs}` : "/kardex";
};

export const listKardex = (filters?: KardexFilter): Promise<TResult<KardexEntry[]>> =>
  get<KardexEntry[]>(toQuery(filters));

export const deleteKardexEntry = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/kardex/${id}`);

export const deleteKardexMedia = (id: string, key: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/kardex/${id}/media?key=${encodeURIComponent(key)}`);

export const fetchKardexTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<KardexEntry>> => {
  const res = await post<Paginated<KardexEntry>>("/kardex/datatable", params);
  return toTableResponse<KardexEntry>(res);
};
