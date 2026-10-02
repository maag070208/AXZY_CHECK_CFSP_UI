import { get, post, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";
import { ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { IUniformCatalog, IUniformCheck, IUniformCheckCreate } from "@app/core/types/supervision.types";

export const getUniformCatalog = (): Promise<TResult<IUniformCatalog>> => get<IUniformCatalog>("/uniform-checks/catalog");

export const createUniformCheck = (data: IUniformCheckCreate): Promise<TResult<IUniformCheck>> =>
  post<IUniformCheck>("/uniform-checks", data);

export const getUniformCheck = (id: string): Promise<TResult<IUniformCheck>> => get<IUniformCheck>(`/uniform-checks/${id}`);

export const deleteUniformCheck = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/uniform-checks/${id}`);

/** Adaptador para `ITDataTable` (la API responde `rows`, la tabla espera `data`). */
export const getPaginatedUniformChecks = async (
  params: ITDataTableFetchParams,
): Promise<{ data: IUniformCheck[]; total: number }> => {
  const res = await post<{ rows: IUniformCheck[]; total: number }>("/uniform-checks/datatable", params);
  return res.success && res.data ? { data: res.data.rows, total: res.data.total } : { data: [], total: 0 };
};
