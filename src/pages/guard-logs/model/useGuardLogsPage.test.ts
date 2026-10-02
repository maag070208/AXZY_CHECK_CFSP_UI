import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeGuardLog } from "@entities/guard-log/__fixtures__";
import type { GuardLogsDeps } from "./deps";
import { useGuardLogsPage } from "./useGuardLogsPage";

const setup = (overrides: Partial<GuardLogsDeps> = {}) => {
  const deps: GuardLogsDeps = {
    role: "ADMIN",
    userClientId: null,
    initialClientId: "",
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    closeShift: vi.fn().mockResolvedValue({ success: true, data: makeGuardLog({ logoutAt: new Date().toISOString() }), messages: [] }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useGuardLogsPage(deps));
  return { ...view, deps };
};

describe("useGuardLogsPage", () => {
  it("envía el rango de hoy dentro de filters y ordena por entrada descendente", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: { otro: "x" } });
    });

    const arg = vi.mocked(deps.fetchTable).mock.calls[0][0];
    expect(arg.sort).toEqual({ key: "loginAt", direction: "desc" });
    expect(arg.filters.otro).toBe("x");
    // El rango por defecto es el día en curso.
    expect(Array.isArray(arg.filters.date)).toBe(true);
    expect((arg.filters.date as Date[])[0]).toBeInstanceOf(Date);
  });

  it("traduce el triple filtro a isOpen", async () => {
    const { result, deps } = setup();

    act(() => result.current.setStatusFilter("OPEN"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].filters.isOpen).toBe(true);

    act(() => result.current.setStatusFilter("CLOSED"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });
    expect(vi.mocked(deps.fetchTable).mock.calls[1][0].filters.isOpen).toBe(false);
  });

  it("un residente queda acotado a su propio cliente y no puede filtrar", async () => {
    const { result, deps } = setup({ role: "RESDN", userClientId: "client-9" });

    expect(result.current.canFilterByClient).toBe(false);

    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });

    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].filters.clientId).toBe("client-9");
  });

  it("toma el cliente inicial de la URL", async () => {
    const { result, deps } = setup({ initialClientId: "client-url" });

    expect(result.current.clientId).toBe("client-url");

    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });

    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].filters.clientId).toBe("client-url");
  });

  it("cerrar turno usa el userId del registro y refresca", async () => {
    const log = makeGuardLog({ userId: "user-42" });
    const { result, deps } = setup();

    act(() => result.current.requestClose(log));
    await act(async () => {
      await result.current.confirmCloseShift();
    });

    expect(deps.closeShift).toHaveBeenCalledWith("user-42");
    expect(deps.notify).toHaveBeenCalledWith("Turno cerrado correctamente", "success");
    expect(result.current.refreshKey).toBe(1);
  });

  it("si cerrar turno falla, muestra el mensaje del backend", async () => {
    const { result, deps } = setup({
      closeShift: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["Turno ya cerrado"] }),
    });

    act(() => result.current.requestClose(makeGuardLog()));
    await act(async () => {
      await result.current.confirmCloseShift();
    });

    expect(deps.notify).toHaveBeenCalledWith("Turno ya cerrado", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("eliminar avisa y refresca", async () => {
    const log = makeGuardLog();
    const { result, deps } = setup();

    act(() => result.current.requestDelete(log));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith(log.id);
    expect(deps.notify).toHaveBeenCalledWith("Registro eliminado", "success");
  });

  it("sin selección no llama al backend", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.confirmCloseShift();
      await result.current.confirmDelete();
    });

    expect(deps.closeShift).not.toHaveBeenCalled();
    expect(deps.remove).not.toHaveBeenCalled();
  });
});
