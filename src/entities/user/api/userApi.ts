/**
 * API de usuarios. `request` de `@shared/api` nunca lanza.
 *
 * Se incluye el ciclo completo (listado, paginado, alta, edición, contraseña,
 * reseteo y baja) para que las páginas no llamen a axios directamente.
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
import type { CreateUserDto, UpdateUserDto, User } from "../model/types";

export const listUsers = (): Promise<TResult<User[]>> => get<User[]>("/users");

export const fetchUsersTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<User>> => {
  const res = await post<Paginated<User>>("/users/datatable", params);
  return toTableResponse<User>(res);
};

export const createUser = (data: CreateUserDto): Promise<TResult<User>> => post<User>("/users", data);

export const updateUser = (id: string, data: UpdateUserDto): Promise<TResult<User>> =>
  put<User>(`/users/${id}`, data);

export const resetPassword = (id: string, password: string): Promise<TResult<boolean>> =>
  put<boolean>(`/users/${id}/reset-password`, { newPassword: password });

export const deleteUser = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/users/${id}`);
