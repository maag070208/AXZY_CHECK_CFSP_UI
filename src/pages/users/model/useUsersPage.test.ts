import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeUser } from "@entities/user/__fixtures__";
import { roleBadge, roleLabel, userInitials, userName } from "@entities/user";
import { makeSchedule } from "@entities/schedule/__fixtures__";
import type { UsersDeps } from "./deps";
import { useUsersPage } from "./useUsersPage";

const setup = (overrides: Partial<UsersDeps> = {}) => {
  const deps: UsersDeps = {
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    update: vi.fn().mockResolvedValue({ success: true, data: makeUser(), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    notify: vi.fn(),
    setGlobalLoading: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useUsersPage(deps));
  return { ...view, deps };
};

describe("useUsersPage", () => {
  it("traduce el triple filtro a active", async () => {
    const { result, deps } = setup();

    act(() => result.current.setActiveFilter("active"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].active).toBe(true);

    act(() => result.current.setActiveFilter("inactive"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[1][0].active).toBe(false);
  });

  it("el buscador va al campo name", async () => {
    const { result, deps } = setup();

    act(() => result.current.setSearchTerm("asael"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });

    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].name).toBe("asael");
  });

  it("eliminar usa el id real (uuid string) y refresca", async () => {
    const user = makeUser({ id: "user-uuid-1" });
    const { result, deps } = setup();

    act(() => result.current.requestDelete(user));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith("user-uuid-1");
    expect(deps.notify).toHaveBeenCalledWith("Usuario eliminado", "success");
    expect(result.current.refreshKey).toBe(1);
    expect(result.current.userToDelete).toBeNull();
  });

  it("apaga el loader global aunque el backend falle", async () => {
    const { result, deps } = setup({
      remove: vi.fn().mockResolvedValue({ success: false, data: false, messages: ["No se puede"] }),
    });

    act(() => result.current.requestDelete(makeUser()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.notify).toHaveBeenCalledWith("No se puede", "error");
    // Se encendió y se apagó.
    expect(deps.setGlobalLoading).toHaveBeenNthCalledWith(1, true);
    expect(deps.setGlobalLoading).toHaveBeenLastCalledWith(false);
  });

  it("sin selección no llama al backend", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).not.toHaveBeenCalled();
  });

  it("reasignar cliente actualiza, avisa y recarga", async () => {
    const user = makeUser({ id: "user-9" });
    const { result, deps } = setup();

    act(() => result.current.setClientUser(user));
    await act(async () => {
      await result.current.reassignClient("client-42");
    });

    expect(deps.update).toHaveBeenCalledWith("user-9", { clientId: "client-42" });
    expect(deps.notify).toHaveBeenCalledWith("Cliente reasignado", "success");
    expect(result.current.clientUser).toBeNull();
    expect(result.current.refreshKey).toBe(1);
  });

  it("cambiar turno actualiza, avisa y recarga", async () => {
    const user = makeUser({ id: "user-10" });
    const { result, deps } = setup();

    act(() => result.current.setScheduleUser(user));
    await act(async () => {
      await result.current.reassignSchedule("schedule-7");
    });

    expect(deps.update).toHaveBeenCalledWith("user-10", { scheduleId: "schedule-7" });
    expect(deps.notify).toHaveBeenCalledWith("Horario actualizado", "success");
    expect(result.current.scheduleUser).toBeNull();
  });

  it("abrir creación limpia la edición y abrir edición la fija", () => {
    const user = makeUser();
    const { result } = setup();

    act(() => result.current.openEdit(user));
    expect(result.current.editingUser?.id).toBe(user.id);

    act(() => result.current.openCreate());
    expect(result.current.editingUser).toBeNull();
    expect(result.current.isWizardOpen).toBe(true);
  });
});

describe("helpers de usuario", () => {
  it("compone nombre e iniciales", () => {
    expect(userName({ name: "Asael", lastName: "Guardia" })).toBe("Asael Guardia");
    expect(userInitials({ name: "asael", lastName: "guardia" })).toBe("AG");
  });

  it("traduce roles y elige badge, con respaldo para desconocidos", () => {
    expect(roleLabel("SHIFT")).toBe("Jefe de turno");
    expect(roleBadge("SHIFT")).toBe("warning");
    expect(roleLabel("RARO")).toBe("RARO");
    expect(roleBadge("RARO")).toBe("secondary");
    expect(roleLabel(undefined)).toBe("Sin rol");
  });

  it("la factoría de horarios compone un rango legible", () => {
    const schedule = makeSchedule({ name: "Nocturno", startTime: "22:00", endTime: "06:00" });
    expect(`${schedule.name} (${schedule.startTime} - ${schedule.endTime})`).toBe("Nocturno (22:00 - 06:00)");
  });
});
