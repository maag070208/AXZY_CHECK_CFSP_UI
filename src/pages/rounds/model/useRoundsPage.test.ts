import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeRound } from "@entities/round/__fixtures__";
import { roundDuration, roundProgress } from "@entities/round";
import type { RoundsDeps } from "./deps";
import { roundVisualState, useRoundsPage } from "./useRoundsPage";

// El hook usa `useSearchParams`: se envuelve con un router real.
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

const setup = (overrides: Partial<RoundsDeps> = {}) => {
  const deps: RoundsDeps = {
    role: "ADMIN",
    clientId: null,
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getById: vi.fn().mockResolvedValue({ success: true, data: { round: makeRound(), timeline: [] }, messages: [] }),
    finish: vi.fn().mockResolvedValue({ success: true, data: makeRound(), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    loadRouteTitles: vi.fn().mockResolvedValue({}),
    notify: vi.fn(),
    ...overrides,
  };
  return { ...renderHook(() => useRoundsPage(deps)), deps };
};

describe("useRoundsPage", () => {
  it("manda el rango de fechas en la zona de operación", () => {
    const { result } = setup();
    const filters = result.current.externalFilters as { date?: [string, string] };

    expect(Array.isArray(filters.date)).toBe(true);
    expect(filters.date![0]).toMatch(/T/);
  });

  it("traduce los filtros de estado y búsqueda", () => {
    const { result } = setup();

    act(() => result.current.setStatusFilter("IN_PROGRESS"));
    expect((result.current.externalFilters as { status?: string }).status).toBe("IN_PROGRESS");

    act(() => result.current.setStatusFilter("ALL"));
    expect(result.current.externalFilters).not.toHaveProperty("status");
  });

  it("un residente sólo ve las rondas de su cliente", () => {
    const { result } = setup({ role: "RESDN", clientId: "cli-9" });

    expect(result.current.isResident).toBe(true);
    expect((result.current.externalFilters as { clientId?: string }).clientId).toBe("cli-9");
  });

  it("un cliente elegido a mano gana sobre el del residente", () => {
    const { result } = setup({ role: "RESDN", clientId: "cli-9" });

    act(() => result.current.setSelectedClientId("cli-1"));
    expect((result.current.externalFilters as { clientId?: string }).clientId).toBe("cli-1");
  });

  it("finalizar una ronda avisa y refresca", async () => {
    const { result, deps } = setup();

    act(() => result.current.setRoundToFinishId("round-1"));
    await act(async () => {
      await result.current.handleEndRound();
    });

    expect(deps.finish).toHaveBeenCalledWith("round-1");
    expect(deps.notify).toHaveBeenCalledWith("Ronda finalizada", "success");
    expect(result.current.roundToFinishId).toBeNull();
    expect(result.current.refreshKey).toBe(1);
  });

  it("eliminar una ronda avisa y refresca", async () => {
    const { result, deps } = setup();

    act(() => result.current.setRoundToDeleteId("round-2"));
    await act(async () => {
      await result.current.confirmDeleteRound();
    });

    expect(deps.remove).toHaveBeenCalledWith("round-2");
    expect(deps.notify).toHaveBeenCalledWith("Ronda eliminada", "success");
  });

  it("si falla el borrado, muestra el mensaje del backend", async () => {
    const { result, deps } = setup({
      remove: vi.fn().mockResolvedValue({ success: false, data: false, messages: ["Ronda en curso"] }),
    });

    act(() => result.current.setRoundToDeleteId("round-3"));
    await act(async () => {
      await result.current.confirmDeleteRound();
    });

    expect(deps.notify).toHaveBeenCalledWith("Ronda en curso", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("carga el mapa de títulos de ruta", async () => {
    const { result } = setup({
      loadRouteTitles: vi.fn().mockResolvedValue({ "r-1": "Ronda nocturna" }),
    });

    await act(async () => {});
    expect(result.current.routesMap["r-1"]).toBe("Ronda nocturna");
  });
});

describe("roundVisualState", () => {
  it("sin escaneos es 'sin actividad', aunque la ronda siga abierta", () => {
    const state = roundVisualState(makeRound({ status: "IN_PROGRESS", _count: { kardexEntries: 0 } }));
    expect(state.label).toBe("Sin actividad");
    expect(state.color).toBe("error");
  });

  it("con escaneos y cerrada es 'completada'", () => {
    const state = roundVisualState(makeRound({ status: "COMPLETED", _count: { kardexEntries: 5 } }));
    expect(state.label).toBe("Completada");
    expect(state.color).toBe("success");
  });

  it("con escaneos y abierta es 'en curso'", () => {
    const state = roundVisualState(makeRound({ status: "IN_PROGRESS", _count: { kardexEntries: 2 } }));
    expect(state.label).toBe("En curso");
    expect(state.color).toBe("warning");
  });

  it("devuelve clases del tema, nunca colores crudos", () => {
    const state = roundVisualState(makeRound({ _count: { kardexEntries: 0 } }));
    expect(state.row).toMatch(/^bg-/);
    expect(state.row).not.toMatch(/#|emerald|rose|amber/);
  });
});

describe("roundDuration", () => {
  it("calcula horas y minutos", () => {
    expect(roundDuration({ startTime: "2026-10-01T08:00:00Z", endTime: "2026-10-01T10:30:00Z", status: "COMPLETED" })).toBe("2 h 30 min");
    expect(roundDuration({ startTime: "2026-10-01T08:00:00Z", endTime: "2026-10-01T08:45:00Z", status: "COMPLETED" })).toBe("45 min");
    expect(roundDuration({ startTime: "2026-10-01T08:00:00Z", endTime: "2026-10-01T10:00:00Z", status: "COMPLETED" })).toBe("2 h");
  });

  it("una ronda abierta se muestra 'en curso'", () => {
    expect(roundDuration({ startTime: "2026-10-01T08:00:00Z", endTime: null, status: "IN_PROGRESS" })).toBe("En curso");
  });

  it("con fechas inválidas no pinta NaN", () => {
    // `endTime` vacío significa "sigue abierta", no "fecha inválida".
    expect(roundDuration({ startTime: "", endTime: "", status: "COMPLETED" })).toBe("En curso");
    expect(roundDuration({ startTime: "no-es-fecha", endTime: "tampoco", status: "COMPLETED" })).toBe("—");
    // Una ronda que "termina" antes de empezar es dato corrupto.
    expect(
      roundDuration({ startTime: "2026-10-01T10:00:00Z", endTime: "2026-10-01T09:00:00Z", status: "COMPLETED" }),
    ).toBe("—");
  });
});

describe("roundProgress", () => {
  it("cuenta escaneos sobre puntos de la ruta", () => {
    const round = makeRound({
      _count: { kardexEntries: 3 },
      recurringConfiguration: {
        id: "r",
        title: "Ruta",
        recurringLocations: [
          { id: "1", locationId: "l1", location: { id: "l1", name: "A" } },
          { id: "2", locationId: "l2", location: { id: "l2", name: "B" } },
          { id: "3", locationId: "l3", location: { id: "l3", name: "C" } },
          { id: "4", locationId: "l4", location: { id: "l4", name: "D" } },
          { id: "5", locationId: "l5", location: { id: "l5", name: "E" } },
          { id: "6", locationId: "l6", location: { id: "l6", name: "F" } },
          { id: "7", locationId: "l7", location: { id: "l7", name: "G" } },
          { id: "8", locationId: "l8", location: { id: "l8", name: "H" } },
        ],
      },
    });
    expect(roundProgress(round)).toBe("3/8");
  });
});
