import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makePanicAlert } from "@entities/panic-alert/__fixtures__";
import type { PanicAlertsDeps } from "./deps";
import { usePanicAlertsPage } from "./usePanicAlertsPage";

const setup = (overrides: Partial<PanicAlertsDeps> = {}) => {
  const deps: PanicAlertsDeps = {
    role: "ADMIN",
    liveAlertIds: [],
    initialAlertId: "",
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    fetchById: vi.fn().mockResolvedValue({ success: true, data: makePanicAlert(), messages: [] }),
    resolve: vi.fn().mockResolvedValue({ success: true, data: makePanicAlert({ status: "RESOLVED" }), messages: [] }),
    markLiveRead: vi.fn(),
    clearInitialAlertId: vi.fn(),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => usePanicAlertsPage(deps));
  return { ...view, deps };
};

describe("usePanicAlertsPage", () => {
  it("pasa buscador y estado al endpoint", async () => {
    const { result, deps } = setup();

    act(() => result.current.setSearchTerm("hotel"));
    act(() => result.current.setStatusFilter("PENDING"));

    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10 });
    });

    expect(deps.fetchTable).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, search: "hotel", status: "PENDING" }),
    );
  });

  it("marca como leídas las alertas en vivo una sola vez", () => {
    const markLiveRead = vi.fn();
    const { rerender } = setup({ liveAlertIds: ["a", "b"], markLiveRead });

    expect(markLiveRead).toHaveBeenCalledTimes(1);

    // Otro render con el mismo lote no debe volver a marcarlas.
    rerender();
    expect(markLiveRead).toHaveBeenCalledTimes(1);
  });

  it("sin alertas en vivo no marca nada", () => {
    const markLiveRead = vi.fn();
    setup({ liveAlertIds: [], markLiveRead });
    expect(markLiveRead).not.toHaveBeenCalled();
  });

  it("identifica cuáles alertas llegaron en vivo", () => {
    const { result } = setup({ liveAlertIds: ["panic-live"] });
    expect(result.current.isLive(makePanicAlert({ id: "panic-live" }))).toBe(true);
    expect(result.current.isLive(makePanicAlert({ id: "panic-otra" }))).toBe(false);
  });

  it("abre el detalle pedido por URL y limpia el parámetro", async () => {
    const alert = makePanicAlert({ id: "panic-url" });
    const clearInitialAlertId = vi.fn();
    const { result } = setup({
      initialAlertId: "panic-url",
      fetchById: vi.fn().mockResolvedValue({ success: true, data: alert, messages: [] }),
      clearInitialAlertId,
    });

    await act(async () => {});
    expect(result.current.viewing?.id).toBe("panic-url");
    expect(clearInitialAlertId).toHaveBeenCalled();
  });

  it("resolver manda el comentario y refresca", async () => {
    const alert = makePanicAlert({ id: "panic-1" });
    const { result, deps } = setup();

    act(() => result.current.requestResolve(alert));
    act(() => result.current.setResolutionComment("  Atendido en sitio  "));

    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.resolve).toHaveBeenCalledWith("panic-1", "Atendido en sitio");
    expect(deps.notify).toHaveBeenCalledWith("Alerta de pánico resuelta", "success");
    expect(result.current.refreshKey).toBe(1);
    expect(result.current.toResolve).toBeNull();
    expect(result.current.resolutionComment).toBe("");
  });

  it("sin comentario manda undefined", async () => {
    const { result, deps } = setup();

    act(() => result.current.requestResolve(makePanicAlert({ id: "panic-2" })));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.resolve).toHaveBeenCalledWith("panic-2", undefined);
  });

  it("si resolver falla, avisa y no refresca", async () => {
    const { result, deps } = setup({
      resolve: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["Ya fue atendida"] }),
    });

    act(() => result.current.requestResolve(makePanicAlert()));
    await act(async () => {
      await result.current.confirmResolve();
    });

    expect(deps.notify).toHaveBeenCalledWith("Ya fue atendida", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("un usuario de cliente no puede resolver", () => {
    expect(setup({ role: "RESDN" }).result.current.canResolve).toBe(false);
    expect(setup({ role: "ADMIN" }).result.current.canResolve).toBe(true);
  });

  it("cancelar limpia la selección y el comentario", () => {
    const { result } = setup();

    act(() => result.current.requestResolve(makePanicAlert()));
    act(() => result.current.setResolutionComment("algo"));
    act(() => result.current.cancelResolve());

    expect(result.current.toResolve).toBeNull();
    expect(result.current.resolutionComment).toBe("");
  });
});
