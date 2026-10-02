import { useCallback, useEffect, useMemo, useState } from "react";
import { printLocationQrs } from "@entities/location";
import type { Route, RouteLocation } from "@entities/route";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { RoutesDeps } from "./deps";

/** Ids de punto de control de una ruta, tolerando las dos formas de la API. */
export const routeLocationIds = (route: Route): string[] => {
  const source: RouteLocation[] = route.recurringLocations ?? route.locations ?? [];

  return source
    .map((l) => l.locationId || l.location?.id)
    .filter((id): id is string => Boolean(id));
};

/**
 * View-model del listado de rutas. Expone los nombres que consumía el JSX.
 */
export const useRoutesPage = ({ fetchTable, remove, notify }: RoutesDeps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [routeToDeleteId, setRouteToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRefreshKey((prev) => prev + 1), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(
    () => ({ title: searchTerm, clientId: selectedClientId }),
    [searchTerm, selectedClientId],
  );

  const memoizedFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Route>> =>
      fetchTable({ ...params, filters: { ...params.filters, ...externalFilters } }),
    [fetchTable, externalFilters],
  );

  const refreshTable = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  const handleDelete = useCallback((id: string) => setRouteToDeleteId(id), []);

  const confirmDelete = useCallback(async () => {
    if (!routeToDeleteId) return;
    const target = routeToDeleteId;
    setIsDeleting(true);

    const res = await remove(target);

    setIsDeleting(false);
    setRouteToDeleteId(null);

    if (res.success) {
      notify("Ruta eliminada", "success");
      refreshTable();
    } else {
      notify(res.messages?.[0] || "Error al eliminar la ruta", "error");
    }
  }, [routeToDeleteId, remove, notify, refreshTable]);

  /** Descarga el PDF con los QRs de todos los puntos de control de la ruta. */
  const handlePrintRouteQRs = useCallback(
    async (route: Route) => {
      const ids = routeLocationIds(route);

      if (ids.length === 0) {
        notify("Esta ruta no tiene puntos de control para imprimir", "error");
        return;
      }

      const res = await printLocationQrs(ids);
      notify(res.success ? "PDF generado con éxito" : "Error al generar el PDF", res.success ? "success" : "error");
    },
    [notify],
  );

  return {
    refreshKey,
    refreshTable,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    externalFilters,
    memoizedFetch,
    routeToDeleteId,
    setRouteToDeleteId,
    isDeleting,
    handleDelete,
    confirmDelete,
    handlePrintRouteQRs,
  };
};

export type RoutesViewModel = ReturnType<typeof useRoutesPage>;
