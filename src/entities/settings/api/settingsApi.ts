/**
 * API de configuración. `request` de `@shared/api` nunca lanza.
 *
 * Endpoints verificados contra `API/src/modules/settings/settings.routes.ts`.
 */
import {
  post,
  put,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type {
  IncidentCategory,
  IncidentType,
  SysConfig,
  UpsertCategoryDto,
  UpsertTypeDto,
} from "../model/types";

const BASE = "/settings";

/* ── Categorías de incidencia ── */

export const fetchCategoriesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IncidentCategory>> => {
  const res = await post<Paginated<IncidentCategory>>(`${BASE}/categories/datatable`, params);
  return toTableResponse<IncidentCategory>(res);
};

export const createCategory = (data: UpsertCategoryDto): Promise<TResult<IncidentCategory>> =>
  post<IncidentCategory>(`${BASE}/categories`, data);

export const updateCategory = (
  id: string,
  data: Partial<UpsertCategoryDto>,
): Promise<TResult<IncidentCategory>> => put<IncidentCategory>(`${BASE}/categories/${id}`, data);

export const deleteCategory = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/categories/${id}`);

/* ── Tipos de incidencia ── */

export const fetchTypesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IncidentType>> => {
  const res = await post<Paginated<IncidentType>>(`${BASE}/types/datatable`, params);
  return toTableResponse<IncidentType>(res);
};

export const createType = (data: UpsertTypeDto): Promise<TResult<IncidentType>> =>
  post<IncidentType>(`${BASE}/types`, data);

export const updateType = (id: string, data: Partial<UpsertTypeDto>): Promise<TResult<IncidentType>> =>
  put<IncidentType>(`${BASE}/types/${id}`, data);

export const deleteType = (id: string): Promise<TResult<boolean>> => remove<boolean>(`${BASE}/types/${id}`);

/* ── Parámetros del sistema ── */

export const fetchSysConfigTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<SysConfig>> => {
  const res = await post<Paginated<SysConfig>>(`${BASE}/sysconfig/datatable`, params);
  return toTableResponse<SysConfig>(res);
};

export const updateSysConfig = (key: string, value: string): Promise<TResult<SysConfig>> =>
  put<SysConfig>(`${BASE}/sysconfig/${key}`, { value });

export const deleteSysConfig = (key: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/sysconfig/${key}`);
