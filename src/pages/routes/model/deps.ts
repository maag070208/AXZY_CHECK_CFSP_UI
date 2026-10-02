/**
 * Dependencias del view-model de rutas.
 */
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { deleteRoute, fetchRoutesTable, getRouteById, type Route } from "@entities/route";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface RoutesDeps {
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Route>>;
  getById: (id: string) => Promise<TResult<Route>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useRoutesDeps = (): RoutesDeps => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      fetchTable: fetchRoutesTable,
      getById: getRouteById,
      remove: deleteRoute,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [dispatch],
  );
};

/** Los QRs de una ruta son los de sus puntos de control (mismo endpoint). */
export { printLocationQrs } from "@entities/location";
