/**
 * Dependencias del view-model de incidencias.
 *
 * Se resuelven aquí (único punto que toca Redux) y se inyectan en
 * `useIncidentsPage`. Así el view-model se puede testear pasando dobles, sin
 * montar el store ni el router.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { deleteIncident, fetchIncidentsTable, resolveIncident, type Incident } from "@entities/incident";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface IncidentsDeps {
  /** Rol del usuario: decide si puede resolver o eliminar. */
  role: string;
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Incident>>;
  resolve: (id: string) => Promise<TResult<Incident>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useIncidentsDeps = (): IncidentsDeps => {
  const dispatch = useDispatch();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  return useMemo(
    () => ({
      role,
      fetchTable: fetchIncidentsTable,
      resolve: resolveIncident,
      remove: deleteIncident,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, dispatch],
  );
};
