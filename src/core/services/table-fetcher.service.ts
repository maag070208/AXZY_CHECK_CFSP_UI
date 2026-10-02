import { post } from "../axios/axios";
import { ITDataTableFetchParams, ITDataTableResponse, Paginated, toTableResponse } from "@shared/api";

/**
 * Petición genérica para `ITDataTable`.
 *
 * El backend devuelve `{ rows, total }` y la tabla espera `{ data, total }`;
 * la conversión la hace `toTableResponse` para no repetirla en cada página.
 *
 * @param url Endpoint de datatable (p. ej. "/users/datatable").
 * @param params Paginación, filtros y orden vigentes.
 */
export const fetchDataTable = async <T>(
  url: string,
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<T>> => {
  const response = await post<Paginated<T>>(url, params);
  return toTableResponse<T>(response);
};
