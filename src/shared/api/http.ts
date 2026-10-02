/**
 * Cliente HTTP de la app.
 *
 * Regla de la capa `shared`: no conoce el store ni el router. La sesión y el
 * manejo de 401 se inyectan desde `app/` con `configureHttp`, así que este
 * módulo se puede importar (y testear) sin montar Redux.
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { fail, TResult } from "./types";

const DEFAULT_BASE_URL = "http://localhost:4444/api/v2";

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

/**
 * Inyecta las dependencias de la app. Se llama una sola vez desde `app/`.
 */
export const configureHttp = (options: {
  getToken?: TokenGetter;
  onUnauthorized?: UnauthorizedHandler;
}): void => {
  if (options.getToken) getToken = options.getToken;
  if (options.onUnauthorized) onUnauthorized = options.onUnauthorized;
};

export const httpClient: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_BASE_URL as string | undefined) || DEFAULT_BASE_URL,
});

httpClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) onUnauthorized();
    return Promise.reject(error);
  },
);

/** Convierte cualquier fallo en un `TResult` fallido, sin lanzar. */
const toFailResult = <T>(error: unknown): TResult<T> => {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as Partial<TResult<unknown>> | undefined;
    if (payload && typeof payload === "object" && Array.isArray(payload.messages)) {
      return fail<T>(payload.messages as string[], payload.stack);
    }
    if (error.response?.status === 401) return fail<T>(["Sesión expirada"]);
    return fail<T>([error.message || "Error de conexión"]);
  }
  if (error instanceof Error) return fail<T>([error.message]);
  return fail<T>(["Error inesperado"]);
};

/**
 * Ejecuta una petición y **siempre** resuelve un `TResult`: nunca lanza.
 * Por eso los view-models pueden hacer `if (!res.success)` sin `try/catch`.
 */
export const request = async <T>(config: AxiosRequestConfig): Promise<TResult<T>> => {
  try {
    const response = await httpClient.request<TResult<T>>(config);
    const body = response.data;
    // Endpoints que no devuelven el sobre estándar: se envuelve igual.
    if (!body || typeof body !== "object" || !("success" in body)) {
      return { success: true, data: body as T, messages: ["Success"] };
    }
    return body;
  } catch (error) {
    return toFailResult<T>(error);
  }
};

export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "GET", url });

export const post = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "POST", url, data });

export const put = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "PUT", url, data });

export const patch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "PATCH", url, data });

export const remove = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: "DELETE", url });
