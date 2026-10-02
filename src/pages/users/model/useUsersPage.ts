import { useCallback, useEffect, useMemo, useState } from "react";
import { listSchedules, type Schedule } from "@entities/schedule";
import type { UpdateUserDto, User } from "@entities/user";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { UsersDeps } from "./deps";

export type UserActiveFilter = "all" | "active" | "inactive";

/** `/users/datatable` recibe los filtros a nivel raíz, no dentro de `filters`. */
export type UsersTableParams = ITDataTableFetchParams & {
  name?: string;
  active?: boolean;
};

/**
 * View-model del directorio de usuarios.
 *
 * Cubre la tabla y los cuatro flujos laterales (crear/editar, contraseña,
 * reasignar cliente, cambiar turno) más el borrado.
 */
export const useUsersPage = ({ fetchTable, update, remove, notify, setGlobalLoading }: UsersDeps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<UserActiveFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [scheduleUser, setScheduleUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Catálogo de horarios para el diálogo de cambio de turno.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await listSchedules();
      if (!cancelled && res.success && Array.isArray(res.data)) setSchedules(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | boolean> = {};
    if (searchTerm.trim()) filters.name = searchTerm.trim();
    if (activeFilter === "active") filters.active = true;
    if (activeFilter === "inactive") filters.active = false;
    return filters;
  }, [searchTerm, activeFilter]);

  const tableFetch = useCallback(
    (params: UsersTableParams): Promise<ITDataTableResponse<User>> =>
      fetchTable({ ...params, ...externalFilters }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveFilter("all");
  }, []);

  const hasFilters = searchTerm.trim().length > 0 || activeFilter !== "all";

  /** Cierra todos los diálogos laterales y recarga la tabla. */
  const closeAllAndRefresh = useCallback(() => {
    setIsWizardOpen(false);
    setEditingUser(null);
    setPasswordUser(null);
    setClientUser(null);
    setScheduleUser(null);
    setRefreshKey((k) => k + 1);
  }, []);

  const openCreate = useCallback(() => {
    setEditingUser(null);
    setIsWizardOpen(true);
  }, []);

  const openEdit = useCallback((user: User) => {
    setEditingUser(user);
    setIsWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false);
    setEditingUser(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!userToDelete || deleting) return;
    const target = userToDelete;

    setDeleting(true);
    setGlobalLoading(true);

    const res = await remove(target.id);

    setDeleting(false);
    setUserToDelete(null);
    setGlobalLoading(false);

    if (res.success && res.data !== false) {
      notify("Usuario eliminado", "success");
      setRefreshKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] || "Error al eliminar usuario", "error");
    }
  }, [userToDelete, deleting, remove, notify, setGlobalLoading]);

  /** Reasigna cliente y cierra el diálogo. */
  const reassignClient = useCallback(
    async (clientId: string) => {
      if (!clientUser) return;
      setGlobalLoading(true);

      const res = await update(clientUser.id, { clientId });

      setGlobalLoading(false);

      if (res.success) {
        notify("Cliente reasignado", "success");
        closeAllAndRefresh();
      } else {
        notify(res.messages?.[0] || "Error al reasignar cliente", "error");
      }
    },
    [clientUser, update, notify, setGlobalLoading, closeAllAndRefresh],
  );

  /** Cambia el turno y cierra el diálogo. */
  const reassignSchedule = useCallback(
    async (scheduleId: string) => {
      if (!scheduleUser) return;
      setGlobalLoading(true);

      const res = await update(scheduleUser.id, { scheduleId } as UpdateUserDto);

      setGlobalLoading(false);

      if (res.success) {
        notify("Horario actualizado", "success");
        closeAllAndRefresh();
      } else {
        notify(res.messages?.[0] || "Error al actualizar el horario", "error");
      }
    },
    [scheduleUser, update, notify, setGlobalLoading, closeAllAndRefresh],
  );

  return {
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

    schedules,

    isWizardOpen,
    editingUser,
    openCreate,
    openEdit,
    closeWizard,

    reassignClient,
    reassignSchedule,

    passwordUser,
    setPasswordUser,
    clientUser,
    setClientUser,
    scheduleUser,
    setScheduleUser,

    userToDelete,
    requestDelete: setUserToDelete,
    cancelDelete: () => setUserToDelete(null),
    confirmDelete,
    deleting,

    handleSuccess: closeAllAndRefresh,
  };
};

export type UsersViewModel = ReturnType<typeof useUsersPage>;
