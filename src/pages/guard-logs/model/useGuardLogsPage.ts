import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  OPERATIONS_TIMEZONE,
  todayRange,
  type GuardLoginLog,
  type GuardLogStatusFilter,
  type GuardLogTableParams,
} from "@entities/guard-log";
import type { ColumnFilters, ITDataTableResponse } from "@shared/api";
import type { GuardLogsDeps } from "./deps";

/**
 * View-model de prenómina (control de asistencia).
 *
 * Nota: `ITDataTable` re-consulta solo cuando cambia `externalFilters`
 * (depende de su `JSON.stringify`), así que no hace falta remontar la tabla al
 * cambiar un filtro como hacía la versión anterior.
 */
export const useGuardLogsPage = ({
  role,
  userClientId,
  initialClientId,
  fetchTable,
  closeShift,
  remove,
  notify,
}: GuardLogsDeps) => {
  const isResident = role === "RESDN";

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(todayRange);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<GuardLogStatusFilter>("ALL");
  const [clientId, setClientId] = useState<string>(initialClientId);
  const [refreshKey, setRefreshKey] = useState(0);

  const [logToClose, setLogToClose] = useState<GuardLoginLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<GuardLoginLog | null>(null);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** El residente solo ve su cliente; el resto puede filtrar. */
  const canFilterByClient = !isResident;
  const effectiveClientId = clientId || (isResident && userClientId ? userClientId : "");

  const externalFilters = useMemo(() => {
    const filters: ColumnFilters = {};

    // Se envían `Date` reales: axios los serializa a ISO en el cuerpo JSON, que
    // es lo que el backend ya recibía. El tipo `ColumnFilterValue` de la
    // librería sólo admite `Date`, no cadenas ISO.
    if (dateRange[0] && dateRange[1]) {
      filters.date = [
        dayjs(dateRange[0]).tz(OPERATIONS_TIMEZONE).startOf("day").toDate(),
        dayjs(dateRange[1]).tz(OPERATIONS_TIMEZONE).endOf("day").toDate(),
      ];
    }
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (statusFilter === "OPEN") filters.isOpen = true;
    else if (statusFilter === "CLOSED") filters.isOpen = false;
    if (effectiveClientId) filters.clientId = effectiveClientId;

    return filters;
  }, [dateRange, searchTerm, statusFilter, effectiveClientId]);

  const tableFetch = useCallback(
    (params: GuardLogTableParams): Promise<ITDataTableResponse<GuardLoginLog>> =>
      fetchTable({
        ...params,
        filters: { ...params.filters, ...externalFilters },
        // La prenómina se lee de lo más reciente a lo más antiguo.
        sort: params.sort ?? { key: "loginAt", direction: "desc" },
      }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateRange(todayRange());
    if (canFilterByClient) setClientId("");
  }, [canFilterByClient]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "ALL" ||
    (canFilterByClient && clientId.length > 0);

  const confirmCloseShift = useCallback(async () => {
    if (!logToClose) return;
    const target = logToClose;
    setClosing(true);

    const res = await closeShift(target.userId);

    setClosing(false);
    setLogToClose(null);

    if (res.success) {
      notify("Turno cerrado correctamente", "success");
      setRefreshKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] || "Error al cerrar turno", "error");
    }
  }, [logToClose, closeShift, notify]);

  const confirmDelete = useCallback(async () => {
    if (!logToDelete) return;
    const target = logToDelete;
    setDeleting(true);

    const res = await remove(target.id);

    setDeleting(false);
    setLogToDelete(null);

    if (res.success) {
      notify("Registro eliminado", "success");
      setRefreshKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] || "Error al eliminar registro", "error");
    }
  }, [logToDelete, remove, notify]);

  return {
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    clientId,
    setClientId,
    canFilterByClient,
    refreshKey,
    refresh,
    clearFilters,
    hasFilters,
    externalFilters,
    tableFetch,

    logToClose,
    requestClose: setLogToClose,
    cancelClose: () => setLogToClose(null),
    confirmCloseShift,
    closing,

    logToDelete,
    requestDelete: setLogToDelete,
    cancelDelete: () => setLogToDelete(null),
    confirmDelete,
    deleting,
  };
};

export type GuardLogsViewModel = ReturnType<typeof useGuardLogsPage>;
