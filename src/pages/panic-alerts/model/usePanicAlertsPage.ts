import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PanicAlert, PanicAlertListParams } from "@entities/panic-alert";
import type { ITDataTableResponse } from "@shared/api";
import type { PanicAlertsDeps } from "./deps";

export type PanicStatusFilter = "ALL" | "PENDING" | "RESOLVED" | "IN_PROGRESS" | "DISMISSED";

/**
 * View-model de alertas de pánico.
 *
 * Dos comportamientos que antes vivían en `useEffect` dentro del componente y
 * aquí son explícitos y testeables:
 *  - al entrar, se marcan como leídas las alertas recibidas en vivo;
 *  - si la URL trae `?id=`, se abre ese detalle una sola vez y se limpia.
 */
export const usePanicAlertsPage = ({
  role,
  liveAlertIds,
  initialAlertId,
  fetchTable,
  fetchById,
  resolve,
  markLiveRead,
  clearInitialAlertId,
  notify,
}: PanicAlertsDeps) => {
  const isClient = role === "RESDN";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PanicStatusFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewing, setViewing] = useState<PanicAlert | null>(null);
  const [toResolve, setToResolve] = useState<PanicAlert | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolving, setResolving] = useState(false);

  const canResolve = !isClient;
  const liveSet = useMemo(() => new Set(liveAlertIds), [liveAlertIds]);

  // Marca como leídas las alertas en vivo (una sola vez por lote).
  const markedRef = useRef(false);
  useEffect(() => {
    if (liveAlertIds.length > 0 && !markedRef.current) {
      markedRef.current = true;
      markLiveRead();
    }
  }, [liveAlertIds.length, markLiveRead]);

  // Abre el detalle pedido por URL y limpia el parámetro.
  const openedFromUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialAlertId || openedFromUrlRef.current === initialAlertId) return;
    openedFromUrlRef.current = initialAlertId;

    let cancelled = false;
    void (async () => {
      const res = await fetchById(initialAlertId);
      if (cancelled) return;
      if (res.success && res.data) setViewing(res.data);
      clearInitialAlertId();
    })();

    return () => {
      cancelled = true;
    };
  }, [initialAlertId, fetchById, clearInitialAlertId]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (statusFilter !== "ALL") filters.status = statusFilter;
    return filters;
  }, [searchTerm, statusFilter]);

  const tableFetch = useCallback(
    (params: { page: number; limit: number; sort?: { key: string; direction: "asc" | "desc" } }): Promise<
      ITDataTableResponse<PanicAlert>
    > =>
      fetchTable({
        page: params.page,
        limit: params.limit,
        sort: params.sort,
        search: externalFilters.search,
        status: externalFilters.status,
      }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("ALL");
  }, []);

  const hasFilters = searchTerm.trim().length > 0 || statusFilter !== "ALL";

  const requestResolve = useCallback((alert: PanicAlert) => {
    setToResolve(alert);
    setResolutionComment("");
  }, []);

  const cancelResolve = useCallback(() => {
    setToResolve(null);
    setResolutionComment("");
  }, []);

  const confirmResolve = useCallback(async () => {
    if (!toResolve) return;
    const target = toResolve;
    setResolving(true);

    const res = await resolve(target.id, resolutionComment.trim() || undefined);

    setResolving(false);
    setToResolve(null);
    setResolutionComment("");

    if (res.success) {
      notify("Alerta de pánico resuelta", "success");
      setRefreshKey((k) => k + 1);
      setViewing((current) => (current?.id === target.id ? null : current));
    } else {
      notify(res.messages?.[0] || "Error al resolver", "error");
    }
  }, [toResolve, resolutionComment, resolve, notify]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    externalFilters,
    tableFetch,
    refreshKey,
    refresh,
    clearFilters,
    hasFilters,

    isClient,
    canResolve,
    /** ¿La alerta llegó en vivo y sigue sin leer? */
    isLive: (alert: PanicAlert) => liveSet.has(alert.id),

    viewing,
    setViewing,

    toResolve,
    requestResolve,
    cancelResolve,
    resolutionComment,
    setResolutionComment,
    confirmResolve,
    resolving,
  };
};

export type PanicAlertsViewModel = ReturnType<typeof usePanicAlertsPage>;
export type { PanicAlertListParams };
