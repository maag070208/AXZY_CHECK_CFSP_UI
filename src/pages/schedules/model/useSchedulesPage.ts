import { useCallback, useMemo, useState } from "react";
import type { Schedule } from "@entities/schedule";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { ScheduleUserRef, SchedulesDeps } from "./deps";

export type ScheduleStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

/** Duración legible del turno: "07:00 – 15:00 · 8 h". */
export const scheduleDuration = (schedule: Pick<Schedule, "startTime" | "endTime">): string => {
  const start = schedule.startTime?.split(":") ?? [];
  const end = schedule.endTime?.split(":") ?? [];
  if (start.length < 2 || end.length < 2) return "";

  const [sh, sm] = start.map(Number);
  const [eh, em] = end.map(Number);
  // `Number.isNaN(undefined)` es `false`, así que hay que comprobar la finitud.
  if (![sh, sm, eh, em].every(Number.isFinite)) return "";

  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60; // turno que cruza medianoche

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

/**
 * View-model de horarios. Expone los mismos nombres que consumía el JSX.
 */
export const useSchedulesPage = ({ fetchTable, create, update, remove, listUsers, notify }: SchedulesDeps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(null);

  const [viewingUsers, setViewingUsers] = useState(false);
  const [selectedScheduleUsers, setSelectedScheduleUsers] = useState<ScheduleUserRef[]>([]);
  const [viewingScheduleName, setViewingScheduleName] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (searchTerm.trim()) f.name = searchTerm.trim();
    if (statusFilter === "ACTIVE") f.active = true;
    if (statusFilter === "INACTIVE") f.active = false;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Schedule>> =>
      fetchTable({ ...params, filters: { ...params.filters, ...externalFilters } }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  const openModal = useCallback((schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setActive(schedule.active);
    } else {
      setEditingSchedule(null);
      setName("");
      setStartTime("07:00");
      setEndTime("15:00");
      setActive(true);
    }
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      notify("El nombre del horario es obligatorio", "error");
      return;
    }

    setIsSaving(true);
    const payload = { name: name.trim(), startTime, endTime, active };
    const res = editingSchedule
      ? await update(editingSchedule.id, payload)
      : await create(payload);
    setIsSaving(false);

    if (res.success) {
      notify(editingSchedule ? "Horario actualizado" : "Horario creado con éxito", "success");
      setIsModalOpen(false);
      refresh();
    } else {
      notify(res.messages?.[0] || "Error al guardar el horario", "error");
    }
  }, [name, startTime, endTime, active, editingSchedule, create, update, notify, refresh]);

  const confirmDelete = useCallback(async () => {
    if (!scheduleToDeleteId) return;
    const target = scheduleToDeleteId;
    setIsDeleting(true);

    const res = await remove(target);

    setIsDeleting(false);
    setScheduleToDeleteId(null);

    if (res.success) {
      notify("Horario eliminado", "success");
      refresh();
    } else {
      notify(res.messages?.[0] || "Error al eliminar el horario", "error");
    }
  }, [scheduleToDeleteId, remove, notify, refresh]);

  const viewUsers = useCallback(
    async (schedule: Schedule) => {
      setViewingScheduleName(schedule.name);
      setViewingUsers(true);
      setLoadingUsers(true);

      const res = await listUsers(schedule.id);

      setLoadingUsers(false);
      setSelectedScheduleUsers(res.success && Array.isArray(res.data) ? res.data : []);
    },
    [listUsers],
  );

  return {
    refreshKey,
    refresh,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    externalFilters,
    memoizedFetch,

    isModalOpen,
    openModal,
    closeModal,
    editingSchedule,
    isSaving,
    handleSave,

    name,
    setName,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    active,
    setActive,

    scheduleToDeleteId,
    setScheduleToDeleteId,
    confirmDelete,
    isDeleting,

    viewingUsers,
    setViewingUsers,
    selectedScheduleUsers,
    viewingScheduleName,
    loadingUsers,
    viewUsers,
  };
};

export type SchedulesViewModel = ReturnType<typeof useSchedulesPage>;
