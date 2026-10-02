import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeSchedule } from "@entities/schedule/__fixtures__";
import type { SchedulesDeps } from "./deps";
import { scheduleDuration, useSchedulesPage } from "./useSchedulesPage";

const setup = (overrides: Partial<SchedulesDeps> = {}) => {
  const deps: SchedulesDeps = {
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn().mockResolvedValue({ success: true, data: makeSchedule(), messages: [] }),
    update: vi.fn().mockResolvedValue({ success: true, data: makeSchedule(), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    listUsers: vi.fn().mockResolvedValue({ success: true, data: [], messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  return { ...renderHook(() => useSchedulesPage(deps)), deps };
};

describe("useSchedulesPage", () => {
  it("traduce el triple filtro a `active` y busca por nombre", () => {
    const { result } = setup();

    act(() => result.current.setSearchTerm("  matutino  "));
    expect(result.current.externalFilters.name).toBe("matutino");

    act(() => result.current.setStatusFilter("ACTIVE"));
    expect(result.current.externalFilters.active).toBe(true);

    act(() => result.current.setStatusFilter("INACTIVE"));
    expect(result.current.externalFilters.active).toBe(false);

    act(() => result.current.setStatusFilter("ALL"));
    expect(result.current.externalFilters).not.toHaveProperty("active");
  });

  it("abrir el modal en modo alta deja los valores por defecto", () => {
    const { result } = setup();

    act(() => result.current.openModal());

    expect(result.current.editingSchedule).toBeNull();
    expect(result.current.name).toBe("");
    expect(result.current.startTime).toBe("07:00");
    expect(result.current.endTime).toBe("15:00");
    expect(result.current.active).toBe(true);
    expect(result.current.isModalOpen).toBe(true);
  });

  it("abrir el modal en edición precarga el horario", () => {
    const schedule = makeSchedule({ name: "Nocturno", startTime: "23:00", endTime: "07:00", active: false });
    const { result } = setup();

    act(() => result.current.openModal(schedule));

    expect(result.current.editingSchedule?.id).toBe(schedule.id);
    expect(result.current.name).toBe("Nocturno");
    expect(result.current.startTime).toBe("23:00");
    expect(result.current.active).toBe(false);
  });

  it("sin nombre no guarda y avisa", async () => {
    const { result, deps } = setup();

    act(() => result.current.setName("   "));
    await act(async () => {
      await result.current.handleSave();
    });

    expect(deps.create).not.toHaveBeenCalled();
    expect(deps.notify).toHaveBeenCalledWith("El nombre del horario es obligatorio", "error");
  });

  it("crea un horario cuando no hay edición", async () => {
    const { result, deps } = setup();

    act(() => result.current.setName("  Vespertino  "));
    await act(async () => {
      await result.current.handleSave();
    });

    expect(deps.create).toHaveBeenCalledWith({
      name: "Vespertino",
      startTime: "07:00",
      endTime: "15:00",
      active: true,
    });
    expect(deps.notify).toHaveBeenCalledWith("Horario creado con éxito", "success");
    expect(result.current.isModalOpen).toBe(false);
  });

  it("edita cuando hay horario seleccionado", async () => {
    const schedule = makeSchedule({ name: "Matutino" });
    const { result, deps } = setup();

    act(() => result.current.openModal(schedule));
    await act(async () => {
      await result.current.handleSave();
    });

    expect(deps.update).toHaveBeenCalledWith(schedule.id, {
      name: "Matutino",
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      active: schedule.active,
    });
    expect(deps.create).not.toHaveBeenCalled();
  });

  it("eliminar refresca y limpia la selección", async () => {
    const { result, deps } = setup();

    act(() => result.current.setScheduleToDeleteId("sch-3"));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith("sch-3");
    expect(result.current.scheduleToDeleteId).toBeNull();
    expect(result.current.refreshKey).toBe(1);
  });

  it("ver personal carga los usuarios del horario", async () => {
    const { result, deps } = setup({
      listUsers: vi.fn().mockResolvedValue({
        success: true,
        data: [{ id: "u1", name: "Ana", active: true }],
        messages: [],
      }),
    });

    await act(async () => {
      await result.current.viewUsers(makeSchedule({ name: "Nocturno" }));
    });

    expect(deps.listUsers).toHaveBeenCalled();
    expect(result.current.selectedScheduleUsers).toHaveLength(1);
    expect(result.current.viewingScheduleName).toBe("Nocturno");
    expect(result.current.loadingUsers).toBe(false);
  });

  it("calcula la duración, incluso si el turno cruza medianoche", () => {
    expect(scheduleDuration({ startTime: "07:00", endTime: "15:00" })).toBe("8 h");
    expect(scheduleDuration({ startTime: "08:00", endTime: "12:30" })).toBe("4 h 30 min");
    expect(scheduleDuration({ startTime: "23:00", endTime: "07:00" })).toBe("8 h");
    expect(scheduleDuration({ startTime: "", endTime: "" })).toBe("");
  });
});
