import { useCallback, useMemo, useState } from "react";
import type { User } from "@entities/user";
import type { ITDataTableResponse } from "@shared/api";
import type { GuardsDeps, GuardsTableParams } from "./deps";

export type GuardActiveFilter = "all" | "active" | "inactive";

/** Roles que aparecen en el directorio de personal operativo. */
export const OPERATIONAL_ROLES = ["GUARD", "SHIFT", "MAINT"] as const;

/**
 * View-model del directorio de guardias.
 *
 * El listado es el endpoint de usuarios filtrado por rol operativo; el filtro
 * va en sintaxis Prisma anidada, tal como lo espera el backend.
 */
export const useGuardsPage = ({ role, fetchTable, update, notify }: GuardsDeps) => {
  const isClient = role === "RESDN";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<GuardActiveFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedGuard, setSelectedGuard] = useState<User | null>(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [guardToToggle, setGuardToToggle] = useState<User | null>(null);
  const [toggling, setToggling] = useState(false);
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [scheduleUser, setScheduleUser] = useState<User | null>(null);

  const externalFilters = useMemo(() => {
    const filters: Record<string, unknown> = {
      name: searchTerm.trim(),
      role: { name: { in: [...OPERATIONAL_ROLES] } },
    };
    if (activeFilter === "active") filters.active = true;
    if (activeFilter === "inactive") filters.active = false;
    return filters;
  }, [searchTerm, activeFilter]);

  const tableFetch = useCallback(
    (params: GuardsTableParams): Promise<ITDataTableResponse<User>> =>
      fetchTable({ ...params, filters: { ...params.filters, ...externalFilters } }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveFilter("all");
  }, []);

  const hasFilters = searchTerm.trim().length > 0 || activeFilter !== "all";

  const openAssignments = useCallback((guard: User) => {
    setSelectedGuard(guard);
    setIsViewOpen(true);
  }, []);

  const openAssignmentForm = useCallback((guard: User) => {
    setSelectedGuard(guard);
    setIsAssignmentOpen(true);
  }, []);

  const confirmToggle = useCallback(async () => {
    if (!guardToToggle) return;
    const target = guardToToggle;
    setToggling(true);

    const res = await update(target.id, { active: !target.active });

    setToggling(false);
    setGuardToToggle(null);

    if (res.success) {
      notify(`Guardia ${target.active ? "desactivado" : "activado"}`, "success");
      setRefreshKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] || "Error al actualizar estado", "error");
    }
  }, [guardToToggle, update, notify]);

  /** Reasigna el cliente del guardia. */
  const reassignClient = useCallback(
    async (clientId: string) => {
      if (!clientUser) return;
      const target = clientUser;
      const res = await update(target.id, { clientId });

      if (res.success) {
        notify("Cliente reasignado", "success");
        setRefreshKey((k) => k + 1);
      } else {
        notify(res.messages?.[0] || "Error al reasignar cliente", "error");
      }
      setClientUser(null);
    },
    [clientUser, update, notify],
  );

  /** Cambia el turno del guardia. */
  const reassignSchedule = useCallback(
    async (scheduleId: string) => {
      if (!scheduleUser) return;
      const target = scheduleUser;
      const res = await update(target.id, { scheduleId });

      if (res.success) {
        notify("Horario actualizado", "success");
        setRefreshKey((k) => k + 1);
      } else {
        notify(res.messages?.[0] || "Error al actualizar el horario", "error");
      }
      setScheduleUser(null);
    },
    [scheduleUser, update, notify],
  );

  return {
    isClient,

    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    externalFilters,
    tableFetch,
    refreshKey,
    refresh,
    clearFilters,
    hasFilters,

    selectedGuard,
    isAssignmentOpen,
    setIsAssignmentOpen,
    isViewOpen,
    setIsViewOpen,
    isNotificationOpen,
    setIsNotificationOpen,
    openAssignments,
    openAssignmentForm,

    guardToToggle,
    requestToggle: setGuardToToggle,
    cancelToggle: () => setGuardToToggle(null),
    confirmToggle,
    toggling,

    clientUser,
    setClientUser,
    reassignClient,
    scheduleUser,
    setScheduleUser,
    reassignSchedule,
    schedules: [] as { id: string; name: string; startTime: string; endTime: string }[],

    handleSuccess: () => {
      setIsAssignmentOpen(false);
      setRefreshKey((k) => k + 1);
    },
  };
};

export type GuardsViewModel = ReturnType<typeof useGuardsPage>;
