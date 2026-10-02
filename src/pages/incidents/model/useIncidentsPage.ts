import { useCallback, useMemo, useState } from "react";
import type { Incident } from "@entities/incident";
import { isPending } from "@entities/incident";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { IncidentsDeps } from "./deps";

export type IncidentStatusFilter = "ALL" | "PENDING" | "ATTENDED";

/**
 * View-model de la página de incidencias.
 *
 * Contiene todo el estado y los casos de uso (resolver, eliminar, filtrar); la
 * vista sólo pinta. No usa Redux, router ni axios: todo entra por `deps`, así
 * que se testea con `renderHook` y dobles, sin DOM.
 */
export const useIncidentsPage = ({ role, fetchTable, resolve, remove, notify }: IncidentsDeps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatusFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [incidentToResolve, setIncidentToResolve] = useState<Incident | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Permisos: quién puede resolver y quién eliminar.
  const canResolve = role === "ADMIN" || role === "LIDER" || role === "SHIFT";
  const canDelete = role === "ADMIN" || role === "LIDER";

  /** Filtros que viajan fuera de la tabla (buscador y triple filtro). */
  const externalFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (statusFilter !== "ALL") filters.status = statusFilter;
    return filters;
  }, [searchTerm, statusFilter]);

  /** `fetchData` de `ITDataTable`: fusiona sus params con los filtros externos. */
  const tableFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Incident>> =>
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
    if (!incidentToResolve) return;
    const target = incidentToResolve;
    setResolving(true);

    const res = await resolve(target.id);

    setResolving(false);
    setIncidentToResolve(null);

    if (res.success) {
      notify("Incidencia resuelta", "success");
      refresh();
      // Si el detalle abierto es el mismo, se cierra para no mostrar datos viejos.
      setViewingIncident((current) => (current?.id === target.id ? null : current));
    } else {
      notify(res.messages?.[0] || "Error al resolver incidencia", "error");
    }
  }, [incidentToResolve, resolve, notify, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!incidentToDelete) return;
    const target = incidentToDelete;
    setDeleting(true);

    const res = await remove(target.id);

    setDeleting(false);
    setIncidentToDelete(null);

    if (res.success) {
      notify("Reporte eliminado", "success");
      refresh();
    } else {
      notify(res.messages?.[0] || "Error al eliminar", "error");
    }
  }, [incidentToDelete, remove, notify, refresh]);

  return {
    // datos / filtros
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

    // permisos
    canResolve,
    canDelete,

    // detalle
    viewingIncident,
    setViewingIncident,

    // resolver
    incidentToResolve,
    requestResolve: setIncidentToResolve,
    cancelResolve: () => setIncidentToResolve(null),
    confirmResolve,
    resolving,

    // eliminar
    incidentToDelete,
    requestDelete: setIncidentToDelete,
    cancelDelete: () => setIncidentToDelete(null),
    confirmDelete,
    deleting,

    // helpers de presentación derivados del estado
    isPending,
  };
};

export type IncidentsViewModel = ReturnType<typeof useIncidentsPage>;
