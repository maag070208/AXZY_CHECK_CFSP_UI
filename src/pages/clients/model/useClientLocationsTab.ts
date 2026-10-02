/**
 * View-model de la pestaña de ubicaciones de un cliente.
 *
 * La lógica se extrajo tal cual; el acceso a datos ya pasaba por las entidades
 * (`request`, que nunca lanza).
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createLocation,
  deleteLocation,
  fetchLocationsTable,
  printLocationQrs,
  updateLocation,
  type Location,
} from "@entities/location";

export interface UseClientLocationsTabOptions {
  clientId: string;
  selectedZoneId?: string | null;
  onCreateFromZone?: () => void;
}

export const useClientLocationsTab = ({ clientId, selectedZoneId, onCreateFromZone }: UseClientLocationsTabOptions) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [createInitialData, setCreateInitialData] = useState<any>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedZoneId) {
      setCreateInitialData({
        clientId: String(clientId),
        zoneId: selectedZoneId,
        name: "",
        reference: "",
      });
      setIsCreateModalOpen(true);
      onCreateFromZone?.();
    }
  }, [selectedZoneId]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return fetchLocationsTable({
        ...params,
        filters: { ...params.filters, clientId },
      });
    },
    [clientId],
  );

  /** La entidad hace la llamada y abre el PDF. */
  const handlePrintBulk = async (ids: string[]) => {
    const res = await printLocationQrs(ids);

    dispatch(
      showToast({
        message: res.success ? "PDF de QRs generado" : "Error al generar el PDF",
        type: res.success ? "success" : "error",
      }),
    );
    if (res.success) setIsBulkPrintOpen(false);
  };

  const confirmDelete = async () => {
    if (!locationToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteLocation(locationToDelete.id);
      if (res.success) {
        dispatch(showToast({ message: "Ubicación eliminada", type: "success" }));
        setRefreshKey((prev) => prev + 1);
        setLocationToDelete(null);
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al eliminar",
            type: "error",
          }),
        );
      }
    } catch (err: any) {
      dispatch(
        showToast({
          message: err?.messages?.[0] || "Error al eliminar ubicación",
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };


  /** Alta desde el formulario. `keepOpen` permite encadenar varias. */
  const handleCreate = useCallback(
    async (data: Parameters<typeof createLocation>[0], keepOpen?: boolean) => {
      const res = await createLocation(data);

      if (res.success) {
        if (!keepOpen) {
          setIsCreateModalOpen(false);
          setCreateInitialData(null);
        }
        setRefreshKey((prev) => prev + 1);
        dispatch(showToast({ message: "Ubicación creada con éxito", type: "success" }));
      } else {
        dispatch(
          showToast({ message: res.messages?.[0] || "Error al crear", type: "error" }),
        );
      }
    },
    [dispatch],
  );

  /** Edición desde el formulario. */
  const handleUpdate = useCallback(
    async (data: Parameters<typeof updateLocation>[1]) => {
      if (!editingLocation) return;
      const target = editingLocation;

      const res = await updateLocation(target.id, data);

      if (res.success) {
        setEditingLocation(null);
        setRefreshKey((prev) => prev + 1);
        dispatch(showToast({ message: "Ubicación actualizada", type: "success" }));
      } else {
        dispatch(
          showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }),
        );
      }
    },
    [editingLocation, dispatch],
  );

  return {
    handleCreate,
    handleUpdate,
    refreshKey,
    setRefreshKey,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingLocation,
    setEditingLocation,
    locationToDelete,
    setLocationToDelete,
    isDeleting,
    isBulkPrintOpen,
    setIsBulkPrintOpen,
    createInitialData,
    setCreateInitialData,
    memoizedFetch,
    confirmDelete,
    handlePrintBulk,
  };
};

export type ClientLocationsTabViewModel = ReturnType<typeof useClientLocationsTab>;
