import { useCallback, useEffect, useMemo, useState } from "react";
import type { Client } from "@entities/client";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import type { ClientsDeps } from "./deps";

export type ClientStatusFilter = "all" | "active" | "inactive";

/** Iniciales para el avatar: "Hotel Puerto Nuevo" → "HP". */
export const clientInitials = (name?: string | null): string => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "??";
};

/**
 * View-model del directorio de clientes.
 *
 * Expone los mismos nombres que consumía el JSX, así la vista no se reescribió.
 */
export const useClientsPage = ({ fetchTable, remove, notify, invalidateCatalog }: ClientsDeps) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // La búsqueda espera 500 ms; el filtro de estado refresca al instante.
  useEffect(() => {
    const timer = setTimeout(() => setRefreshKey((prev) => prev + 1), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [statusFilter]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean | Date> = {};
    if (searchTerm) filters.name = searchTerm;
    if (statusFilter !== "all") filters.active = statusFilter === "active";
    return filters;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Client>> => fetchTable(params),
    [fetchTable],
  );

  const refreshTable = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  const handleSuccess = useCallback(() => {
    setIsCreateModalOpen(false);
    setEditingClient(null);
    refreshTable();
  }, [refreshTable]);

  const confirmDelete = useCallback(async () => {
    if (!clientToDeleteId || isDeleting) return;
    const target = clientToDeleteId;
    setIsDeleting(true);

    const res = await remove(target);

    setIsDeleting(false);

    if (res.success) {
      notify("Cliente eliminado", "success");
      invalidateCatalog();
      refreshTable();
    } else {
      notify(res.messages?.[0] || "Error al eliminar cliente", "error");
    }
    setClientToDeleteId(null);
  }, [clientToDeleteId, isDeleting, remove, notify, invalidateCatalog, refreshTable]);

  return {
    refreshKey,
    refreshTable,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    externalFilters,
    memoizedFetch,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingClient,
    setEditingClient,
    clientToDeleteId,
    setClientToDeleteId,
    isDeleting,
    confirmDelete,
    handleSuccess,
  };
};

export type ClientsViewModel = ReturnType<typeof useClientsPage>;
