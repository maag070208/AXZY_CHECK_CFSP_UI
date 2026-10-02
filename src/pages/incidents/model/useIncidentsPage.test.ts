import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeIncident } from "@entities/incident/__fixtures__";
import type { IncidentsDeps } from "./deps";
import { useIncidentsPage } from "./useIncidentsPage";

/**
 * El view-model se prueba sin DOM, sin router y sin Redux: todas sus
 * dependencias entran por parámetro. Por eso estos casos no se rompen cuando
 * cambia un texto de la interfaz.
 */
const setup = (overrides: Partial<IncidentsDeps> = {}) => {
  const deps: IncidentsDeps = {
    role: "ADMIN",
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    resolve: vi.fn().mockResolvedValue({ success: true, data: makeIncident({ status: "ATTENDED" }), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useIncidentsPage(deps));
  return { ...view, deps };
};

describe("useIncidentsPage", () => {
  it("fusiona los filtros externos con los parámetros de la tabla", async () => {
    const { result, deps } = setup();

    act(() => result.current.setSearchTerm("fuga"));
    act(() => result.current.setStatusFilter("PENDING"));

    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });

    expect(deps.fetchTable).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      filters: {},
      search: "fuga",
      status: "PENDING",
    });
  });

  it("resolver avisa, refresca y cierra el diálogo", async () => {
    const incident = makeIncident({ id: "incident-1", status: "PENDING" });
    const { result, deps } = setup();

    act(() => result.current.requestResolve(incident));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.resolve).toHaveBeenCalledWith("incident-1");
    expect(deps.notify).toHaveBeenCalledWith("Incidencia resuelta", "success");
    expect(result.current.incidentToResolve).toBeNull();
    expect(result.current.refreshKey).toBe(1);
  });

  it("si resolver falla, muestra el mensaje del backend y no refresca", async () => {
    const incident = makeIncident({ status: "PENDING" });
    const { result, deps } = setup({
      resolve: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["No autorizado"] }),
    });

    act(() => result.current.requestResolve(incident));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.notify).toHaveBeenCalledWith("No autorizado", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("eliminar avisa y refresca", async () => {
    const incident = makeIncident();
    const { result, deps } = setup();

    act(() => result.current.requestDelete(incident));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith(incident.id);
    expect(deps.notify).toHaveBeenCalledWith("Reporte eliminado", "success");
    expect(result.current.refreshKey).toBe(1);
  });

  it("al resolver la incidencia abierta en el detalle, lo cierra", async () => {
    const incident = makeIncident({ id: "incident-detalle" });
    const { result } = setup();

    act(() => result.current.setViewingIncident(incident));
    act(() => result.current.requestResolve(incident));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(result.current.viewingIncident).toBeNull();
  });

  it("limpiar filtros deja el estado inicial", () => {
    const { result } = setup();

    act(() => result.current.setSearchTerm("algo"));
    act(() => result.current.setStatusFilter("ATTENDED"));
    expect(result.current.hasFilters).toBe(true);

    act(() => result.current.clearFilters());

    expect(result.current.searchTerm).toBe("");
    expect(result.current.statusFilter).toBe("ALL");
    expect(result.current.hasFilters).toBe(false);
  });

  it("los permisos dependen del rol", () => {
    const guard = setup({ role: "GUARD" });
    expect(guard.result.current.canResolve).toBe(false);
    expect(guard.result.current.canDelete).toBe(false);

    const shift = setup({ role: "SHIFT" });
    expect(shift.result.current.canResolve).toBe(true);
    expect(shift.result.current.canDelete).toBe(false);

    const admin = setup({ role: "ADMIN" });
    expect(admin.result.current.canResolve).toBe(true);
    expect(admin.result.current.canDelete).toBe(true);
  });

  it("sin incidencia seleccionada no llama al backend", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.confirmResolve();
      await result.current.confirmDelete();
    });

    expect(deps.resolve).not.toHaveBeenCalled();
    expect(deps.remove).not.toHaveBeenCalled();
  });
});
