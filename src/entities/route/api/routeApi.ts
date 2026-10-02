/**
 * API de rutas. `request` de `@shared/api` nunca lanza.
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
import type { CreateRouteDto, Route } from "../model/types";

export const listRoutes = (): Promise<TResult<Route[]>> => get<Route[]>("/recurring");

export const getRouteById = (id: string): Promise<TResult<Route>> => get<Route>(`/recurring/${id}`);

export const fetchRoutesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Route>> => {
  const res = await post<Paginated<Route>>("/recurring/datatable", params);
  return toTableResponse<Route>(res);
};

export const createRoute = (data: CreateRouteDto): Promise<TResult<Route>> => post<Route>("/recurring", data);

export const updateRoute = (id: string, data: Partial<CreateRouteDto>): Promise<TResult<Route>> =>
  put<Route>(`/recurring/${id}`, data);

export const deleteRoute = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/recurring/${id}`);

/** Asigna guardias a una ruta recurrente. */
export const assignGuardToRoute = (configId: string, guardIds: string[]): Promise<TResult<boolean>> =>
  post<boolean>(`/routes/${configId}/assign-guards`, { guardIds });
