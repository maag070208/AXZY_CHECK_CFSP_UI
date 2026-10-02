import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeUser } from "@entities/user/__fixtures__";
import type { GuardsDeps } from "./deps";
import { useGuardsPage } from "./useGuardsPage";

const setup = (overrides: Partial<GuardsDeps> = {}) => {
  const deps: GuardsDeps = {
    role: "ADMIN",
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    update: vi.fn().mockResolvedValue({ success: true, data: makeUser(), messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useGuardsPage(deps));
  return { ...view, deps };
};

describe("useGuardsPage", () => {
  it("filtra siempre por roles operativos y busca por nombre", async () => {
    const { result, deps } = setup();

    act(() => result.current.setSearchTerm("asael"));
    await act(async () => {
      await result.current.tableFetch({ filters: {} });
    });

    const arg = vi.mocked(deps.fetchTable).mock.calls[0][0];
    expect(arg.filters?.name).toBe("asael");
    expect(arg.filters?.role).toEqual({ name: { in: ["GUARD", "SHIFT", "MAINT"] } });
  });

  it("traduce el triple filtro a active", async () => {
    const { result, deps } = setup();

    act(() => result.current.setActiveFilter("active"));
    await act(async () => {
      await result.current.tableFetch({ filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].filters?.active).toBe(true);

    act(() => result.current.setActiveFilter("inactive"));
    await act(async () => {
      await result.current.tableFetch({ filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[1][0].filters?.active).toBe(false);
  });

  it("alternar estado invierte `active`, avisa y refresca", async () => {
    const guard = makeUser({ id: "guard-1", active: true });
    const { result, deps } = setup();

    act(() => result.current.requestToggle(guard));
    await act(async () => {
      await result.current.confirmToggle();
    });

    expect(deps.update).toHaveBeenCalledWith("guard-1", { active: false });
    expect(deps.notify).toHaveBeenCalledWith("Guardia desactivado", "success");
    expect(result.current.refreshKey).toBe(1);
    expect(result.current.guardToToggle).toBeNull();
  });

  it("si falla el cambio de estado, muestra el mensaje del backend", async () => {
    const { result, deps } = setup({
      update: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["Sin permiso"] }),
    });

    act(() => result.current.requestToggle(makeUser({ active: true })));
    await act(async () => {
      await result.current.confirmToggle();
    });

    expect(deps.notify).toHaveBeenCalledWith("Sin permiso", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("sin selección no llama al backend", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.confirmToggle();
    });

    expect(deps.update).not.toHaveBeenCalled();
  });

  it("reasignar cliente usa el cliente elegido y refresca", async () => {
    const { result, deps } = setup();

    act(() => result.current.setClientUser(makeUser({ id: "guard-2" })));
    await act(async () => {
      await result.current.reassignClient("client-9");
    });

    expect(deps.update).toHaveBeenCalledWith("guard-2", { clientId: "client-9" });
    expect(deps.notify).toHaveBeenCalledWith("Cliente reasignado", "success");
    expect(result.current.clientUser).toBeNull();
  });

  it("cambiar turno usa el horario elegido y refresca", async () => {
    const { result, deps } = setup();

    act(() => result.current.setScheduleUser(makeUser({ id: "guard-3" })));
    await act(async () => {
      await result.current.reassignSchedule("schedule-4");
    });

    expect(deps.update).toHaveBeenCalledWith("guard-3", { scheduleId: "schedule-4" });
    expect(deps.notify).toHaveBeenCalledWith("Horario actualizado", "success");
    expect(result.current.scheduleUser).toBeNull();
  });

  it("un usuario de cliente no ve las acciones de gestión", () => {
    expect(setup({ role: "RESDN" }).result.current.isClient).toBe(true);
    expect(setup({ role: "ADMIN" }).result.current.isClient).toBe(false);
  });

  it("abrir tareas y abrir asignación fijan el guardia seleccionado", () => {
    const guard = makeUser();
    const { result } = setup();

    act(() => result.current.openAssignments(guard));
    expect(result.current.selectedGuard?.id).toBe(guard.id);
    expect(result.current.isViewOpen).toBe(true);

    act(() => result.current.openAssignmentForm(guard));
    expect(result.current.isAssignmentOpen).toBe(true);
  });
});
