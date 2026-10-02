/**
 * Dependencias del view-model de mantenimientos.
 *
 * Único punto que toca Redux; el view-model recibe dobles en los tests.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteMaintenance,
  fetchMaintenancesTable,
  resolveMaintenance,
  type Maintenance,
} from "@entities/maintenance";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface MaintenancesDeps {
  role: string;
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Maintenance>>;
  resolve: (id: string) => Promise<TResult<Maintenance>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useMaintenancesDeps = (): MaintenancesDeps => {
  const dispatch = useDispatch();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  return useMemo(
    () => ({
      role,
      fetchTable: fetchMaintenancesTable,
      resolve: resolveMaintenance,
      remove: deleteMaintenance,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, dispatch],
  );
};
