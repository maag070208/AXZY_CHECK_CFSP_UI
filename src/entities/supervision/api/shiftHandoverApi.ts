/**
 * API de entregas de turno. `request` de `@shared/api` nunca lanza.
 *
 * Endpoints verificados contra
 * `API/src/modules/shift-handovers/shift-handover.routes.ts`.
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
import type {
  IChecklistItemDefinition,
  IShiftHandoverCreate,
  IShiftHandoverDetail,
  IShiftHandoverListItem,
} from "../model/types";

const BASE = "/shift-handovers";

export const getHandoverCatalog = (): Promise<TResult<IChecklistItemDefinition[]>> =>
  get<IChecklistItemDefinition[]>(`${BASE}/catalog`);

export const createShiftHandover = (
  data: IShiftHandoverCreate,
): Promise<TResult<IShiftHandoverDetail>> => post<IShiftHandoverDetail>(BASE, data);

export const getShiftHandover = (id: string): Promise<TResult<IShiftHandoverDetail>> =>
  get<IShiftHandoverDetail>(`${BASE}/${id}`);

export const deleteShiftHandover = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/${id}`);

/** El backend responde `rows`; la tabla espera `data`. */
export const fetchShiftHandoversTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IShiftHandoverListItem>> => {
  const res = await post<Paginated<IShiftHandoverListItem>>(`${BASE}/datatable`, params);
  return toTableResponse<IShiftHandoverListItem>(res);
};
