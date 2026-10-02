/**
 * API de autenticación. `/users/login` verificado contra
 * `API/src/modules/users/user.routes.ts`; el registro usa el alta de usuarios.
 *
 * `request` de `@shared/api` nunca lanza.
 */
import { post } from "@shared/api";
import { IAuthLogin, IAuthRegister } from "@app/core/types/auth.types";
import type { TResult } from "@shared/api";

export const login = async (data: IAuthLogin): Promise<TResult<string>> => {
  return await post<string>("/users/login", data);
};

export const register = async (data: IAuthRegister): Promise<TResult<void>> => {
  return await post<void>("/users", data);
};
