/**
 * Dependencias del view-model de usuarios. Único punto que toca Redux.
 */
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteUser,
  fetchUsersTable,
  updateUser,
  type UpdateUserDto,
  type User,
} from "@entities/user";
import type { ITDataTableResponse, TResult } from "@shared/api";
import type { UsersTableParams } from "./useUsersPage";

export interface UsersDeps {
  fetchTable: (params: UsersTableParams) => Promise<ITDataTableResponse<User>>;
  update: (id: string, data: UpdateUserDto) => Promise<TResult<User>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUsersDeps = (): UsersDeps => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      fetchTable: fetchUsersTable,
      update: updateUser,
      remove: deleteUser,
      notify: (message, type) => dispatch(showToast({ message, type })),
      setGlobalLoading: (loading) => dispatch(loading ? showLoader() : hideLoader()),
    }),
    [dispatch],
  );
}
