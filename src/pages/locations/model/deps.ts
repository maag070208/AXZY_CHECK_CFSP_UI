/**
 * Dependencias del view-model de ubicaciones.
 *
 * Antes la página llamaba a `post()` de axios directamente para dos endpoints
 * que no existían en el servicio; ahora todo pasa por `@entities/location`.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createLocation,
  deleteLocation,
  fetchLocationsTable,
  updateLocation,
  type CreateLocationDto,
  type Location,
} from "@entities/location";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface LocationsDeps {
  role: string;
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Location>>;
  create: (data: CreateLocationDto) => Promise<TResult<Location>>;
  update: (id: string, data: Partial<CreateLocationDto>) => Promise<TResult<Location>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useLocationsDeps = (): LocationsDeps => {
  const dispatch = useDispatch();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  return useMemo(
    () => ({
      role,
      fetchTable: fetchLocationsTable,
      create: createLocation,
      update: updateLocation,
      remove: deleteLocation,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, dispatch],
  );
};
