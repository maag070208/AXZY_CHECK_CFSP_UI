/**
 * API de ubicaciones. `request` de `@shared/api` nunca lanza.
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
import type { CreateLocationDto, Location } from "../model/types";

export const listLocations = (): Promise<TResult<Location[]>> => get<Location[]>("/locations");

/** Puntos de control asignados a un guardia. */
export const getLocationsByGuard = (guardId: string): Promise<TResult<Location[]>> =>
  get<Location[]>("/locations/by-guard/" + guardId);

export const getLocationsByClient = (clientId: string): Promise<TResult<Location[]>> =>
  get<Location[]>("/locations", { params: { clientId } });

export const fetchLocationsTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Location>> => {
  const res = await post<Paginated<Location>>("/locations/datatable", params);
  return toTableResponse<Location>(res);
};

export const createLocation = (data: CreateLocationDto): Promise<TResult<Location>> =>
  post<Location>("/locations", data);

export const updateLocation = (id: string, data: Partial<CreateLocationDto>): Promise<TResult<Location>> =>
  put<Location>(`/locations/${id}`, data);

export const deleteLocation = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/locations/${id}`);

/**
 * Genera el PDF de QRs y lo abre en una pestaña nueva.
 *
 * Se hace aquí y no en la vista porque es una llamada HTTP con `responseType:
 * blob`, y la regla de MVVM es que la vista nunca habla con axios.
 */
export const printLocationQrs = async (ids: string[]): Promise<TResult<boolean>> => {
  const res = await post<Blob>("/locations/print-qrs", { ids }, { responseType: "blob" });

  if (!res.success || !res.data) return res as unknown as TResult<boolean>;

  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  window.open(url, "_blank");
  return { success: true, data: true, messages: ["PDF generado"] };
};
