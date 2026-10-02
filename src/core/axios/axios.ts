/**
 * Adaptador legacy sobre `@shared/api`.
 *
 * Existe sólo mientras termina la migración a FSD. Mantiene la semántica
 * histórica del proyecto (los servicios **lanzan** el `TResult` en error, ver
 * `FANSAL_RULES.txt` §3D) para no romper los ~50 consumidores que ya envuelven
 * las llamadas en `try/catch`.
 *
 * El código nuevo debe usar `request`/`get`/`post`… de `@shared/api`, que
 * nunca lanzan y por eso permiten view-models sin `try/catch`.
 */
import { AxiosRequestConfig } from "axios";
import { httpClient, request, TResult } from "@shared/api";

/** Reproduce la semántica legacy: en fallo se lanza el `TResult`. */
const throwing = async <T>(promise: Promise<TResult<T>>): Promise<TResult<T>> => {
  const result = await promise;
  if (!result.success) throw result;
  return result;
};

export const post = <T>(url: string, data: unknown, config?: AxiosRequestConfig) =>
  throwing<T>(request<T>({ ...config, method: "POST", url, data }));

export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  throwing<T>(request<T>({ ...config, method: "GET", url }));

export const patch = <T>(url: string, data: unknown, config?: AxiosRequestConfig) =>
  throwing<T>(request<T>({ ...config, method: "PATCH", url, data }));

export const put = <T>(url: string, data: unknown, config?: AxiosRequestConfig) =>
  throwing<T>(request<T>({ ...config, method: "PUT", url, data }));

export const remove = <T>(url: string, config?: AxiosRequestConfig) =>
  throwing<T>(request<T>({ ...config, method: "DELETE", url }));

/** @deprecated Usa `httpClient` de `@shared/api`. */
export const axiosInstance = httpClient;
