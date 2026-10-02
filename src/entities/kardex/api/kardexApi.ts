/**
 * API de Kardex. `request` de `@shared/api` nunca lanza.
 *
 * Nota: `/kardex/datatable` es el endpoint que responde `{ data, total }` en
 * lugar de `{ rows, total }`; `toTableResponse` acepta ambas formas.
 */
import {
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


export const deleteKardexEntry = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/kardex/${id}`);


export const fetchKardexTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<KardexEntry>> => {
  const res = await post<Paginated<KardexEntry>>("/kardex/datatable", params);
  return toTableResponse<KardexEntry>(res);
};
