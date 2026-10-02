import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeMaintenance } from "@entities/maintenance/__fixtures__";
import type { MaintenancesDeps } from "./deps";
import { useMaintenancesPage } from "./useMaintenancesPage";

const setup = (overrides: Partial<MaintenancesDeps> = {}) => {
  const deps: MaintenancesDeps = {
    role: "ADMIN",
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    resolve: vi.fn().mockResolvedValue({ success: true, data: makeMaintenance({ status: "ATTENDED" }), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useMaintenancesPage(deps));
  return { ...view, deps };
};

describe("useMaintenancesPage", () => {
  it("fusiona los filtros externos con los parámetros de la tabla", async () => {
    const { result, deps } = setup();

    act(() => result.current.setSearchTerm("fuga"));
    act(() => result.current.setStatusFilter("ATTENDED"));

    await act(async () => {
      await result.current.tableFetch({ page: 2, limit: 20, filters: {} });
    });

    expect(deps.fetchTable).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      filters: {},
      search: "fuga",
      status: "ATTENDED",
    });
  });

  it("resolver usa el id real (uuid string) y refresca", async () => {
    const maintenance = makeMaintenance({ id: "mnt-uuid-1" });
    const { result, deps } = setup();

    act(() => result.current.requestResolve(maintenance));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.resolve).toHaveBeenCalledWith("mnt-uuid-1");
    expect(deps.notify).toHaveBeenCalledWith("Mantenimiento resuelto", "success");
    expect(result.current.refreshKey).toBe(1);
  });

  it("si resolver falla, no refresca y muestra el mensaje del backend", async () => {
    const { result, deps } = setup({
      resolve: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["Sin permiso"] }),
    });

    act(() => result.current.requestResolve(makeMaintenance()));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.notify).toHaveBeenCalledWith("Sin permiso", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("eliminar avisa y refresca", async () => {
    const maintenance = makeMaintenance();
    const { result, deps } = setup();

    act(() => result.current.requestDelete(maintenance));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith(maintenance.id);
    expect(deps.notify).toHaveBeenCalledWith("Registro eliminado", "success");
    expect(result.current.refreshKey).toBe(1);
  });

  it("cierra el detalle si se resuelve el registro abierto", async () => {
    const maintenance = makeMaintenance({ id: "mnt-detalle" });
    const { result } = setup();

    act(() => result.current.setViewingMaintenance(maintenance));
    act(() => result.current.requestResolve(maintenance));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(result.current.viewingMaintenance).toBeNull();
  });

  it("los permisos dependen del rol", () => {
    expect(setup({ role: "GUARD" }).result.current.canResolve).toBe(false);
    expect(setup({ role: "GUARD" }).result.current.canDelete).toBe(false);
    expect(setup({ role: "SHIFT" }).result.current.canResolve).toBe(true);
    expect(setup({ role: "SHIFT" }).result.current.canDelete).toBe(false);
    expect(setup({ role: "LIDER" }).result.current.canDelete).toBe(true);
  });

  it("limpiar filtros vuelve al estado inicial", () => {
    const { result } = setup();

    act(() => result.current.setSearchTerm("algo"));
    act(() => result.current.setStatusFilter("PENDING"));
    expect(result.current.hasFilters).toBe(true);

    act(() => result.current.clearFilters());

    expect(result.current.hasFilters).toBe(false);
  });
});
