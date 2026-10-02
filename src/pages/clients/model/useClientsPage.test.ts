import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@entities/client/__fixtures__";
import type { ClientsDeps } from "./deps";
import { clientInitials, useClientsPage } from "./useClientsPage";

const setup = (overrides: Partial<ClientsDeps> = {}) => {
  const deps: ClientsDeps = {
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getById: vi.fn().mockResolvedValue({ success: true, data: makeClient(), messages: [] }),
    create: vi.fn().mockResolvedValue({ success: true, data: makeClient(), messages: [] }),
    update: vi.fn().mockResolvedValue({ success: true, data: makeClient(), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    notify: vi.fn(),
    invalidateCatalog: vi.fn(),
    ...overrides,
  };
  return { ...renderHook(() => useClientsPage(deps)), deps };
};

describe("useClientsPage", () => {
  it("busca por nombre y filtra por estado", () => {
    const { result } = setup();

    act(() => result.current.setSearchTerm("hotel"));
    expect(result.current.externalFilters.name).toBe("hotel");

    act(() => result.current.setStatusFilter("active"));
    expect(result.current.externalFilters.active).toBe(true);

    act(() => result.current.setStatusFilter("inactive"));
    expect(result.current.externalFilters.active).toBe(false);
  });

  it("con el filtro en `all` no manda la clave `active`", () => {
    const { result } = setup();
    expect(result.current.externalFilters).not.toHaveProperty("active");
  });

  it("eliminar invalida el catálogo cacheado y refresca", async () => {
    const { result, deps } = setup();

    act(() => result.current.setClientToDeleteId("client-7"));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith("client-7");
    expect(deps.notify).toHaveBeenCalledWith("Cliente eliminado", "success");
    expect(deps.invalidateCatalog).toHaveBeenCalled();
    expect(result.current.clientToDeleteId).toBeNull();
  });

  it("si falla el borrado, muestra el mensaje del backend y no invalida el catálogo", async () => {
    const { result, deps } = setup({
      remove: vi.fn().mockResolvedValue({ success: false, data: false, messages: ["Cliente con rutas activas"] }),
    });

    act(() => result.current.setClientToDeleteId("client-8"));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.notify).toHaveBeenCalledWith("Cliente con rutas activas", "error");
    expect(deps.invalidateCatalog).not.toHaveBeenCalled();
  });

  it("sin id seleccionado no llama al backend", async () => {
    const { result, deps } = setup();
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(deps.remove).not.toHaveBeenCalled();
  });

  it("cerrar el modal de alta limpia el cliente en edición", () => {
    const { result } = setup();

    act(() => result.current.setEditingClient(makeClient()));
    act(() => result.current.handleSuccess());

    expect(result.current.editingClient).toBeNull();
    expect(result.current.isCreateModalOpen).toBe(false);
  });

  it("el paso a la tabla es directo: no reescribe el resultado", async () => {
    const page = { data: [makeClient()], total: 1 };
    const { result, deps } = setup({ fetchTable: vi.fn().mockResolvedValue(page) });

    await act(async () => {
      await result.current.memoizedFetch({ page: 1, limit: 10, filters: {} });
    });

    expect(deps.fetchTable).toHaveBeenCalled();
  });

  it("genera iniciales a partir del nombre", () => {
    expect(clientInitials("Hotel Puerto Nuevo")).toBe("HP");
    expect(clientInitials("  ")).toBe("??");
    expect(clientInitials(null)).toBe("??");
  });
});
