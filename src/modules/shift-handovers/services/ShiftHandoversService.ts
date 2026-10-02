import { get, post, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";
import { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import {
  IChecklistItemDefinition,
  IShiftHandoverCreate,
  IShiftHandoverDetail,
  IShiftHandoverListItem,
} from "@app/core/types/supervision.types";

export const getHandoverCatalog = (): Promise<TResult<IChecklistItemDefinition[]>> =>
  get<IChecklistItemDefinition[]>("/shift-handovers/catalog");

export const createShiftHandover = (data: IShiftHandoverCreate): Promise<TResult<IShiftHandoverDetail>> =>
  post<IShiftHandoverDetail>("/shift-handovers", data);

export const getShiftHandover = (id: string): Promise<TResult<IShiftHandoverDetail>> =>
  get<IShiftHandoverDetail>(`/shift-handovers/${id}`);

export const deleteShiftHandover = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/shift-handovers/${id}`);

/** Adaptador para `ITDataTable` (la API responde `rows`, la tabla espera `data`). */
export const getPaginatedShiftHandovers = async (
  params: ITDataTableFetchParams,
): Promise<{ data: IShiftHandoverListItem[]; total: number }> => {
  const res = await post<{ rows: IShiftHandoverListItem[]; total: number }>("/shift-handovers/datatable", params);
  return res.success && res.data ? { data: res.data.rows, total: res.data.total } : { data: [], total: 0 };
};
