import { useCallback, useMemo, useState } from "react";
import {
  canSaveNotification,
  EMPTY_NOTIFICATION_FORM,
  toNotificationForm,
  toNotificationPayload,
  type NotificationForm,
  type ScheduledNotification,
} from "@entities/scheduled-notification";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { NotificationsDeps } from "./deps";

export type NotificationStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

/**
 * View-model de notificaciones programadas.
 *
 * Cubre los tres casos de uso (crear/editar, eliminar, enviar ahora) y el
 * formulario. La vista sólo pinta y enlaza campos.
 */
export const useNotificationsPage = ({ fetchTable, create, update, remove, sendNow, notify }: NotificationsDeps) => {
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduledNotification | null>(null);
  const [form, setForm] = useState<NotificationForm>(EMPTY_NOTIFICATION_FORM);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<ScheduledNotification | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [sendingId, setSendingId] = useState<string | null>(null);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (statusFilter === "ACTIVE") filters.status = "active";
    if (statusFilter === "INACTIVE") filters.status = "inactive";
    return filters;
  }, [statusFilter]);

  const tableFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<ScheduledNotification>> =>
      fetchTable({ ...params, filters: { ...params.filters, ...externalFilters } }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const setField = useCallback(
    <K extends keyof NotificationForm>(key: K, value: NotificationForm[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_NOTIFICATION_FORM);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((row: ScheduledNotification) => {
    setEditing(row);
    setForm(toNotificationForm(row));
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditing(null);
  }, []);

  const save = useCallback(async () => {
    if (!canSaveNotification(form)) return;
    setSaving(true);

    const payload = toNotificationPayload(form);
    const res = editing ? await update(editing.id, payload) : await create(payload);

    setSaving(false);

    if (res.success) {
      notify(editing ? "Notificación actualizada" : "Notificación creada", "success");
      setIsFormOpen(false);
      setEditing(null);
      setRefreshKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] || "Error al guardar", "error");
    }
  }, [form, editing, create, update, notify]);

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const target = toDelete;
    setDeleting(true);

    const res = await remove(target.id);

    setDeleting(false);
    setToDelete(null);

    if (res.success) {
      notify("Notificación eliminada", "success");
      setRefreshKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] || "Error al eliminar", "error");
    }
  }, [toDelete, remove, notify]);

  const send = useCallback(
    async (row: ScheduledNotification) => {
      setSendingId(row.id);

      const res = await sendNow(row);

      setSendingId(null);

      if (res.success) notify("Notificación enviada", "success");
      else notify(res.messages?.[0] || "Error al enviar", "error");
    },
    [sendNow, notify],
  );

  return {
    statusFilter,
    setStatusFilter,
    externalFilters,
    tableFetch,
    refreshKey,
    refresh,

    isFormOpen,
    editing,
    form,
    setField,
    openCreate,
    openEdit,
    closeForm,
    save,
    saving,
    canSave: canSaveNotification(form),

    toDelete,
    requestDelete: setToDelete,
    cancelDelete: () => setToDelete(null),
    confirmDelete,
    deleting,

    sendingId,
    send,
  };
};

export type NotificationsViewModel = ReturnType<typeof useNotificationsPage>;
