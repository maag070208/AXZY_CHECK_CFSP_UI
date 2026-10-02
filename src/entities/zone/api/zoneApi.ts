/**
 * API de zonas. `request` de `@shared/api` nunca lanza.
 *
 * `getZones` traía el mismo endpoint duplicado que `fetchZonesTable`; aquí hay
 * uno solo, paginado y tipado.
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
import type { CreateZoneDto, UpdateZoneDto, Zone } from "../model/types";

export const getZonesByClient = (clientId: string): Promise<TResult<Zone[]>> =>
  get<Zone[]>(`/zones/client/${clientId}`);

export const fetchZonesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Zone>> => {
  const res = await post<Paginated<Zone>>("/zones/datatable", params);
  return toTableResponse<Zone>(res);
};

export const createZone = (data: CreateZoneDto): Promise<TResult<Zone>> => post<Zone>("/zones", data);

export const updateZone = (id: string, data: UpdateZoneDto): Promise<TResult<Zone>> =>
  put<Zone>(`/zones/${id}`, data);

export const deleteZone = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/zones/${id}`);
