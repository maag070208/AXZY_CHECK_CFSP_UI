/**
 * API de clientes. `request` de `@shared/api` nunca lanza.
 *
 * `getPaginatedClients` devolvía `{ rows, total }`, que no es lo que espera
 * `ITDataTable`; ahora se normaliza con `toTableResponse`.
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
import type { Client, ClientCreate, ClientUpdate } from "../model/types";

export const getClientById = (id: string): Promise<TResult<Client>> => get<Client>(`/clients/${id}`);

export const listClients = (): Promise<TResult<Client[]>> => get<Client[]>("/clients");

export const fetchClientsTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Client>> => {
  const res = await post<Paginated<Client>>("/clients/datatable", params);
  return toTableResponse<Client>(res);
};

export const createClient = (data: ClientCreate): Promise<TResult<Client>> => post<Client>("/clients", data);

export const updateClient = (id: string, data: ClientUpdate): Promise<TResult<Client>> =>
  put<Client>(`/clients/${id}`, data);

export const deleteClient = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/clients/${id}`);
