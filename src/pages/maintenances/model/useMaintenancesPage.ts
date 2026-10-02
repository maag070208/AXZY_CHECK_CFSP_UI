import { useCallback, useMemo, useState } from "react";
import type { Maintenance } from "@entities/maintenance";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { MaintenancesDeps } from "./deps";

export type MaintenanceStatusFilter = "ALL" | "PENDING" | "ATTENDED";

/**
 * View-model de la página de mantenimientos.
 *
 * Mismo patrón que `pages/incidents`: estado y casos de uso aquí, la vista sólo
 * pinta. Sin Redux, sin router, sin axios.
 */
export const useMaintenancesPage = ({ role, fetchTable, resolve, remove, notify }: MaintenancesDeps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatusFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewingMaintenance, setViewingMaintenance] = useState<Maintenance | null>(null);
  const [maintenanceToResolve, setMaintenanceToResolve] = useState<Maintenance | null>(null);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<Maintenance | null>(null);
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canResolve = role === "ADMIN" || role === "LIDER" || role === "SHIFT";
  const canDelete = role === "ADMIN" || role === "LIDER";

  const externalFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (statusFilter !== "ALL") filters.status = statusFilter;
    return filters;
  }, [searchTerm, statusFilter]);

  const tableFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Maintenance>> =>
      fetchTable({ ...params, ...externalFilters }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("ALL");
  }, []);

  const hasFilters = searchTerm.trim().length > 0 || statusFilter !== "ALL";

  const confirmResolve = useCallback(async () => {
    if (!maintenanceToResolve) return;
    const target = maintenanceToResolve;
    setResolving(true);

    const res = await resolve(target.id);

    setResolving(false);
    setMaintenanceToResolve(null);

    if (res.success) {
      notify("Mantenimiento resuelto", "success");
      refresh();
      setViewingMaintenance((current) => (current?.id === target.id ? null : current));
    } else {
      notify(res.messages?.[0] || "Error al resolver mantenimiento", "error");
    }
  }, [maintenanceToResolve, resolve, notify, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!maintenanceToDelete) return;
    const target = maintenanceToDelete;
    setDeleting(true);

    const res = await remove(target.id);

    setDeleting(false);
    setMaintenanceToDelete(null);

    if (res.success) {
      notify("Registro eliminado", "success");
      refresh();
    } else {
      notify(res.messages?.[0] || "Error al eliminar", "error");
    }
  }, [maintenanceToDelete, remove, notify, refresh]);

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

    canResolve,
    canDelete,

    viewingMaintenance,
    setViewingMaintenance,

    maintenanceToResolve,
    requestResolve: setMaintenanceToResolve,
    cancelResolve: () => setMaintenanceToResolve(null),
    confirmResolve,
    resolving,

    maintenanceToDelete,
    requestDelete: setMaintenanceToDelete,
    cancelDelete: () => setMaintenanceToDelete(null),
    confirmDelete,
    deleting,
  };
};

export type MaintenancesViewModel = ReturnType<typeof useMaintenancesPage>;
