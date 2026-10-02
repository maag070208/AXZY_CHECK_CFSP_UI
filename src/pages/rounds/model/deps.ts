/**
 * Dependencias del view-model de rondas.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { listRoutes } from "@entities/route";
import {
  deleteRound,
  endRound,
  fetchRoundsTable,
  getRoundById,
  type Round,
  type RoundDetail,
} from "@entities/round";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface RoundsDeps {
  role: string;
  clientId: string | null;
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Round>>;
  getById: (id: string) => Promise<TResult<RoundDetail>>;
  finish: (id: string) => Promise<TResult<Round>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  /** Mapa id → título de ruta, para no mostrar UUIDs en la tabla. */
  loadRouteTitles: () => Promise<Record<string, string>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useRoundsDeps = (): RoundsDeps => {
  const dispatch = useDispatch();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";
  const clientId = useSelector((state: AppState) => state.auth.clientId);

  return useMemo(
    () => ({
      role,
      clientId,
      fetchTable: fetchRoundsTable,
      getById: getRoundById,
      finish: endRound,
      remove: deleteRound,
      loadRouteTitles: async () => {
        const res = await listRoutes();
        if (!res.success || !Array.isArray(res.data)) return {};
        return Object.fromEntries(res.data.map((r) => [r.id, r.title]));
      },
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, clientId, dispatch],
  );
};
