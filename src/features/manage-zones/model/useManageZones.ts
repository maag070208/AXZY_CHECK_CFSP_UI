/**
 * View-model de administración de zonas.
 *
 * Es una **feature**: la consume la pestaña de zonas del detalle de cliente.
 * Antes vivía dentro de `modules/zones` y llamaba a axios directo.
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { createZone, deleteZone, getZonesByClient, updateZone, type Zone } from "@entities/zone";
import type { TResult } from "@shared/api";

export interface ManageZonesDeps {
  listByClient: (clientId: string) => Promise<TResult<Zone[]>>;
  create: (data: { clientId: string; name: string }) => Promise<TResult<Zone>>;
  update: (id: string, data: { name?: string; active?: boolean }) => Promise<TResult<Zone>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useManageZonesDeps = (): ManageZonesDeps => {
  const dispatch = useDispatch();
  return {
    listByClient: getZonesByClient,
    create: createZone,
    update: updateZone,
    remove: deleteZone,
    notify: (message, type) => dispatch(showToast({ message, type })),
  };
};

export interface ManageZonesOptions {
  isOpen: boolean;
  clientId: string;
}

export const useManageZones = (deps: ManageZonesDeps, { isOpen, clientId }: ManageZonesOptions) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Zone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchZones = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const res = await deps.listByClient(clientId);
    setLoading(false);
    if (res.success && Array.isArray(res.data)) setZones(res.data);
  }, [clientId, deps]);

  useEffect(() => {
    if (isOpen && clientId) void fetchZones();
  }, [isOpen, clientId, fetchZones]);

  const create = useCallback(async () => {
    if (!newName.trim()) return;
    setSaving(true);

    const res = await deps.create({ clientId, name: newName.trim() });

    setSaving(false);

    if (res.success) {
      setNewName("");
      deps.notify("Zona registrada con éxito", "success");
      await fetchZones();
    } else {
      deps.notify(res.messages?.[0] || "Error al crear la zona", "error");
    }
  }, [newName, clientId, deps, fetchZones]);

  const saveEdit = useCallback(async () => {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);

    const res = await deps.update(editing.id, { name: editing.name.trim() });

    setSaving(false);

    if (res.success) {
      setEditing(null);
      deps.notify("Zona actualizada", "success");
      await fetchZones();
    } else {
      deps.notify(res.messages?.[0] || "Error al actualizar la zona", "error");
    }
  }, [editing, deps, fetchZones]);

  const confirmDelete = useCallback(async () => {
    if (!zoneToDelete) return;
    const target = zoneToDelete;
    setDeleting(true);

    const res = await deps.remove(target.id);

    setDeleting(false);
    setZoneToDelete(null);

    if (res.success) {
      deps.notify("Zona eliminada", "success");
      await fetchZones();
    } else {
      deps.notify(res.messages?.[0] || "Error al eliminar la zona", "error");
    }
  }, [zoneToDelete, deps, fetchZones]);

  return {
    zones,
    loading,
    newName,
    setNewName,
    create,
    saving,
    editing,
    setEditing,
    saveEdit,
    zoneToDelete,
    requestDelete: setZoneToDelete,
    cancelDelete: () => setZoneToDelete(null),
    confirmDelete,
    deleting,
  };
};

export type ManageZonesViewModel = ReturnType<typeof useManageZones>;
