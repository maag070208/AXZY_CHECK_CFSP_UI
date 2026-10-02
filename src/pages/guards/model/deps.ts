/**
 * Dependencias del view-model de guardias. Único punto que toca Redux.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { updateUser, fetchUsersTable, type UpdateUserDto, type User } from "@entities/user";
import type { ITDataTableResponse, TResult } from "@shared/api";

/** `/users/datatable` recibe los filtros a nivel raíz, con sintaxis Prisma. */
export type GuardsTableParams = Record<string, unknown> & {
  filters?: Record<string, unknown>;
};

export interface GuardsDeps {
  role: string;
  fetchTable: (params: GuardsTableParams) => Promise<ITDataTableResponse<User>>;
  update: (id: string, data: UpdateUserDto) => Promise<TResult<User>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useGuardsDeps = (): GuardsDeps => {
  const dispatch = useDispatch();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  return useMemo(
    () => ({
      role,
      fetchTable: (params) => fetchUsersTable(params as never),
      update: updateUser,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, dispatch],
  );
};
