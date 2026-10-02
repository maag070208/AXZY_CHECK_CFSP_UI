/**
 * View-model de la pestaña de zonas de un cliente.
 *
 * La lógica se extrajo tal cual; el acceso a datos ya pasaba por
 * `@entities/zone` (con `request`, que nunca lanza).
 */
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createZone,
  deleteZone,
  fetchZonesTable,
  updateZone,
  type Zone,
} from "@entities/zone";

export interface UseClientZonesTabOptions {
  clientId: string;
  onSelectZone?: (zone: Zone) => void;
}

export const useClientZonesTab = ({ clientId }: UseClientZonesTabOptions) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [newZoneName, setNewZoneName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [updating, setUpdating] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const memoizedFetch = useCallback(
    (params: any) => {
      return fetchZonesTable({
        ...params,
        filters: { ...params.filters, clientId },
      });
    },
    [clientId],
  );

  const handleCreate = async () => {
    if (!newZoneName.trim()) return;
    setCreating(true);
    try {
      const res = await createZone({ clientId, name: newZoneName });
      if (res.success) {
        setNewZoneName("");
        setRefreshKey((prev) => prev + 1);
        dispatch(
          showToast({ message: "Zona registrada con éxito", type: "success" }),
        );
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo crear la zona",
            type: "error",
          }),
        );
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingZone || !editingZone.name.trim()) return;
    setUpdating(true);
    try {
      const res = await updateZone(editingZone.id, { name: editingZone.name });
      if (res.success) {
        setEditingZone(null);
        setRefreshKey((prev) => prev + 1);
        dispatch(showToast({ message: "Zona actualizada", type: "success" }));
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al actualizar",
            type: "error",
          }),
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!zoneToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteZone(zoneToDelete.id);
      if (res.success) {
        setRefreshKey((prev) => prev + 1);
        dispatch(showToast({ message: "Zona eliminada", type: "success" }));
        setZoneToDelete(null);
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se puede eliminar",
            type: "error",
          }),
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return {
    refreshKey,
    refresh,
    newZoneName,
    setNewZoneName,
    creating,
    editingZone,
    setEditingZone,
    updating,
    zoneToDelete,
    setZoneToDelete,
    isDeleting,
    memoizedFetch,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
};

export type ClientZonesTabViewModel = ReturnType<typeof useClientZonesTab>;
