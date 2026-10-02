/**
 * Dependencias del view-model de alertas de pánico.
 *
 * Único punto que toca Redux y el router. El estado "en vivo" (alertas que
 * llegan por Ably) entra como dato, no como store: así el view-model se
 * testea sin montar Redux.
 */
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { markAlertsRead } from "@app/core/store/panic/panic.slice";
import {
  fetchPanicAlertsTable,
  getPanicAlertById,
  resolvePanicAlert,
  type PanicAlert,
  type PanicAlertListParams,
} from "@entities/panic-alert";
import type { ITDataTableResponse, TResult } from "@shared/api";

export interface PanicAlertsDeps {
  role: string;
  /** Ids de alertas que llegaron en vivo (Ably) y están sin leer. */
  liveAlertIds: string[];
  /** `?id=` de la URL: abre el detalle automáticamente. */
  initialAlertId: string;
  fetchTable: (params: PanicAlertListParams) => Promise<ITDataTableResponse<PanicAlert>>;
  fetchById: (id: string) => Promise<TResult<PanicAlert>>;
  resolve: (id: string, comment?: string) => Promise<TResult<PanicAlert>>;
  /** Marca como leídas las alertas en vivo al entrar a la pantalla. */
  markLiveRead: () => void;
  /** Limpia el `?id=` para que un refresh no reabra el detalle. */
  clearInitialAlertId: () => void;
  notify: (message: string, type: "success" | "error") => void;
}

export const usePanicAlertsDeps = (): PanicAlertsDeps => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";
  const liveAlertIds = useSelector((state: AppState) => state.panic.unreadIds);
  const initialAlertId = searchParams.get("id") ?? "";

  return useMemo(
    () => ({
      role,
      liveAlertIds,
      initialAlertId,
      fetchTable: fetchPanicAlertsTable,
      fetchById: getPanicAlertById,
      resolve: resolvePanicAlert,
      markLiveRead: () => dispatch(markAlertsRead()),
      clearInitialAlertId: () => {
        const next = new URLSearchParams(searchParams);
        next.delete("id");
        setSearchParams(next, { replace: true });
      },
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [role, liveAlertIds, initialAlertId, dispatch, searchParams, setSearchParams],
  );
};
