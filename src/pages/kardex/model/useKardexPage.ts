import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  OPERATIONS_TIMEZONE,
  todayRange,
  type KardexEntry,
  type KardexStatusFilter,
} from "@entities/kardex";
import type { ColumnFilters, ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { KardexDeps } from "./deps";

/**
 * View-model del expediente Kardex.
 *
 * `ITDataTable` re-consulta al cambiar `externalFilters`, así que no hace falta
 * remontar la tabla en cada cambio de filtro.
 */
export const useKardexPage = ({ fetchTable, remove, notify }: KardexDeps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [scanTypeFilter, setScanTypeFilter] = useState<KardexStatusFilter>("ALL");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>(todayRange);
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewingEntry, setViewingEntry] = useState<KardexEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<KardexEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const externalFilters = useMemo(() => {
    const filters: ColumnFilters = {};

    // `Date` reales: axios los serializa a ISO, que es lo que el backend ya
    // recibía. `ColumnFilterValue` no admite cadenas ISO.
    if (dateRange[0] && dateRange[1]) {
      filters.date = [
        dayjs(dateRange[0]).tz(OPERATIONS_TIMEZONE).startOf("day").toDate(),
        dayjs(dateRange[1]).tz(OPERATIONS_TIMEZONE).endOf("day").toDate(),
      ];
    }
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (scanTypeFilter !== "ALL") filters.scanType = scanTypeFilter;

    return filters;
  }, [dateRange, searchTerm, scanTypeFilter]);

  const tableFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<KardexEntry>> =>
      fetchTable({ ...params, filters: { ...params.filters, ...externalFilters } }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setScanTypeFilter("ALL");
    setDateRange(todayRange());
  }, []);

  const hasFilters = searchTerm.trim().length > 0 || scanTypeFilter !== "ALL";

  const confirmDelete = useCallback(async () => {
    if (!entryToDelete) return;
    const target = entryToDelete;
    setDeleting(true);

    const res = await remove(target.id);

    setDeleting(false);
    setEntryToDelete(null);

    if (res.success) {
      notify("Marcaje eliminado", "success");
      setRefreshKey((k) => k + 1);
      setViewingEntry((current) => (current?.id === target.id ? null : current));
    } else {
      notify(res.messages?.[0] || "Error al eliminar marcaje", "error");
    }
  }, [entryToDelete, remove, notify]);

  return {
    searchTerm,
    setSearchTerm,
    scanTypeFilter,
    setScanTypeFilter,
    dateRange,
    setDateRange,
    externalFilters,
    tableFetch,
    refreshKey,
    refresh,
    clearFilters,
    hasFilters,

    viewingEntry,
    setViewingEntry,

    entryToDelete,
    requestDelete: setEntryToDelete,
    cancelDelete: () => setEntryToDelete(null),
    confirmDelete,
    deleting,
  };
};

export type KardexViewModel = ReturnType<typeof useKardexPage>;
