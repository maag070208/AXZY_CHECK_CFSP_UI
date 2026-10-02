import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateLocationDto, Location } from "@entities/location";
import { printLocationQrs } from "@entities/location";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import { useSearchParams } from "react-router-dom";
import type { LocationsDeps } from "./deps";

/**
 * View-model de la página de ubicaciones.
 *
 * Expone los mismos nombres que consumía el JSX original (`memoizedFetch`,
 * `handleCreate`, `locationToDelete`…), así la vista no tuvo que reescribirse.
 * Los dos endpoints de PDF que se llamaban con `post()` desde el componente
 * ahora pasan por la entidad.
 */
export const useLocationsPage = ({ role, fetchTable, create, update, remove, notify }: LocationsDeps) => {
  /** Antes se comparaba contra el rol "OPERATOR", que no existe en la API. */
  const canManage = role === "ADMIN" || role === "LIDER";

  const [searchParams] = useSearchParams();

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>(searchParams.get("clientId") ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZonesModalOpen, setIsZonesModalOpen] = useState(false);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const cid = searchParams.get("clientId");
    if (cid) setSelectedClientId(cid);
  }, [searchParams]);

  // El buscador y el filtro de cliente esperan 500 ms antes de consultar.
  useEffect(() => {
    const timer = setTimeout(() => setRefreshKey((prev) => prev + 1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedClientId]);

  const externalFilters = useMemo(
    () => ({ name: searchTerm, clientId: selectedClientId }),
    [searchTerm, selectedClientId],
  );

  const memoizedFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Location>> =>
      fetchTable({ ...params, filters: { ...params.filters, ...externalFilters } }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  const handleCreate = useCallback(
    async (data: CreateLocationDto, keepOpen?: boolean) => {
      setSaving(true);
      const res = await create(data);
      setSaving(false);

      if (res.success) {
        notify("Ubicación creada con éxito", "success");
        if (!keepOpen) setIsModalOpen(false);
        refresh();
      } else {
        notify(res.messages?.join(", ") || "Error al crear ubicación", "error");
      }
    },
    [create, notify, refresh],
  );

  const handleEdit = useCallback(
    async (data: Partial<CreateLocationDto>) => {
      if (!editingLocation) return;
      setSaving(true);
      const res = await update(editingLocation.id, data);
      setSaving(false);

      if (res.success) {
        notify("Ubicación actualizada", "success");
        setEditingLocation(null);
        refresh();
      } else {
        notify(res.messages?.join(", ") || "Error al actualizar ubicación", "error");
      }
    },
    [editingLocation, update, notify, refresh],
  );

  const confirmDelete = useCallback(async () => {
    if (!locationToDelete) return;
    const target = locationToDelete;
    setDeleting(true);

    const res = await remove(target.id);

    setDeleting(false);
    setLocationToDelete(null);

    if (res.success) {
      notify("Ubicación eliminada", "success");
      refresh();
    } else {
      notify(res.messages?.join(", ") || "Error al eliminar", "error");
    }
  }, [locationToDelete, remove, notify, refresh]);

  const handlePrintQR = useCallback(
    async (location: Location) => {
      const res = await printLocationQrs([location.id]);
      notify(res.success ? "PDF generado con éxito" : "Error al generar el PDF", res.success ? "success" : "error");
    },
    [notify],
  );

  const handlePrintBulk = useCallback(
    async (ids: string[]) => {
      const res = await printLocationQrs(ids);
      if (res.success) {
        notify("PDF generado con éxito", "success");
        setIsBulkPrintModalOpen(false);
      } else {
        notify("Error al generar el PDF", "error");
      }
    },
    [notify],
  );

  return {
    canManage,
    refreshKey,
    refresh,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    isModalOpen,
    setIsModalOpen,
    isZonesModalOpen,
    setIsZonesModalOpen,
    isBulkPrintModalOpen,
    setIsBulkPrintModalOpen,
    editingLocation,
    setEditingLocation,
    locationToDelete,
    setLocationToDelete,
    saving,
    deleting,
    externalFilters,
    memoizedFetch,
    handleCreate,
    handleEdit,
    confirmDelete,
    handlePrintQR,
    handlePrintBulk,
  };
};

export type LocationsViewModel = ReturnType<typeof useLocationsPage>;
