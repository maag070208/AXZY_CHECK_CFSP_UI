/**
 * API de verificación de uniformes. `request` de `@shared/api` nunca lanza.
 *
 * Endpoints verificados contra `API/src/modules/uniform-checks/uniform-check.routes.ts`.
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
import type { IUniformCatalog, IUniformCheck, IUniformCheckCreate } from "../model/types";

const BASE = "/uniform-checks";

export const getUniformCatalog = (): Promise<TResult<IUniformCatalog>> =>
  get<IUniformCatalog>(`${BASE}/catalog`);

export const createUniformCheck = (data: IUniformCheckCreate): Promise<TResult<IUniformCheck>> =>
  post<IUniformCheck>(BASE, data);

export const getUniformCheck = (id: string): Promise<TResult<IUniformCheck>> =>
  get<IUniformCheck>(`${BASE}/${id}`);

export const deleteUniformCheck = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/${id}`);

/** El backend responde `rows`; la tabla espera `data`. */
export const fetchUniformChecksTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IUniformCheck>> => {
  const res = await post<Paginated<IUniformCheck>>(`${BASE}/datatable`, params);
  return toTableResponse<IUniformCheck>(res);
};
