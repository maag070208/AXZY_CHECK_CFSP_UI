/**
 * Dependencias del view-model de prenómina.
 *
 * El `clientId` inicial (que puede venir de la URL) y el cliente del usuario
 * residente se resuelven aquí: el view-model no conoce el router ni Redux.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  clockOut,
  deleteGuardLog,
  fetchGuardLogsTable,
  type GuardLoginLog,
  type GuardLogTableParams,
} from "@entities/guard-log";
import type { ITDataTableResponse, TResult } from "@shared/api";

export interface GuardLogsDeps {
  role: string;
  /** Cliente del usuario cuando es residente: acota su propio listado. */
  userClientId: string | null;
  /** Cliente pedido por URL (`?clientId=`). */
  initialClientId: string;
  fetchTable: (params: GuardLogTableParams) => Promise<ITDataTableResponse<GuardLoginLog>>;
  closeShift: (guardId: string) => Promise<TResult<GuardLoginLog>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useGuardLogsDeps = (): GuardLogsDeps => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";
  const userClientId = useSelector((state: AppState) => state.auth.clientId);
  const initialClientId = searchParams.get("clientId") ?? "";

  return useMemo(
    () => ({
      role,
      userClientId: userClientId != null ? String(userClientId) : null,
      initialClientId,
      fetchTable: fetchGuardLogsTable,
      closeShift: clockOut,
      remove: deleteGuardLog,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, userClientId, initialClientId, dispatch],
  );
}
