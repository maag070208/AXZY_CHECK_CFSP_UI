import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeKardexEntry } from "@entities/kardex/__fixtures__";
import { formatLogDuration, formatLogTime } from "@entities/guard-log";
import { formatScanDate, formatScanTime, translateScanType } from "@entities/kardex";
import type { KardexDeps } from "./deps";
import { useKardexPage } from "./useKardexPage";

const setup = (overrides: Partial<KardexDeps> = {}) => {
  const deps: KardexDeps = {
    fetchTable: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    remove: vi.fn().mockResolvedValue({ success: true, data: true, messages: [] }),
    notify: vi.fn(),
    ...overrides,
  };
  const view = renderHook(() => useKardexPage(deps));
  return { ...view, deps };
};

describe("useKardexPage", () => {
  it("envía el rango de hoy y fusiona los filtros de la tabla", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: { otro: "x" } });
    });

    const arg = vi.mocked(deps.fetchTable).mock.calls[0][0];
    expect(arg.filters.otro).toBe("x");
    expect((arg.filters.date as Date[])[0]).toBeInstanceOf(Date);
  });

  it("traduce el triple filtro a scanType", async () => {
    const { result, deps } = setup();

    act(() => result.current.setScanTypeFilter("ASSIGNMENT"));
    await act(async () => {
      await result.current.tableFetch({ page: 1, limit: 10, filters: {} });
    });

    expect(vi.mocked(deps.fetchTable).mock.calls[0][0].filters.scanType).toBe("ASSIGNMENT");
  });

  it("eliminar avisa, refresca y cierra el detalle si era el mismo", async () => {
    const entry = makeKardexEntry({ id: "kardex-1" });
    const { result, deps } = setup();

    act(() => result.current.setViewingEntry(entry));
    act(() => result.current.requestDelete(entry));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).toHaveBeenCalledWith("kardex-1");
    expect(deps.notify).toHaveBeenCalledWith("Marcaje eliminado", "success");
    expect(result.current.refreshKey).toBe(1);
    expect(result.current.viewingEntry).toBeNull();
  });

  it("si eliminar falla, muestra el mensaje del backend y no refresca", async () => {
    const { result, deps } = setup({
      remove: vi.fn().mockResolvedValue({ success: false, data: null, messages: ["No se pudo"] }),
    });

    act(() => result.current.requestDelete(makeKardexEntry()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.notify).toHaveBeenCalledWith("No se pudo", "error");
    expect(result.current.refreshKey).toBe(0);
  });

  it("sin selección no llama al backend", async () => {
    const { result, deps } = setup();

    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(deps.remove).not.toHaveBeenCalled();
  });
});

describe("helpers de dominio de kardex", () => {
  it("traduce los tipos de marcaje y respeta los desconocidos", () => {
    expect(translateScanType("ASSIGNMENT")).toBe("Asignada");
    expect(translateScanType("RECURRING")).toBe("Ronda");
    expect(translateScanType("FREE")).toBe("Libre");
    expect(translateScanType("OTRO")).toBe("OTRO");
  });

  it("formatea la cronometría en la zona de operación", () => {
    // 2026-10-01T18:07:35Z == 11:07:35 en America/Tijuana (UTC-7).
    expect(formatScanTime("2026-10-01T18:07:35.000Z")).toBe("11:07:35 HRS");
    expect(formatScanDate("2026-10-01T18:07:35.000Z")).toBe("01 oct, 2026");
  });

  it("la duración de prenómina sale en HH:mm y es null si sigue abierto", () => {
    expect(formatLogDuration({ loginAt: "2026-10-01T10:00:00Z", logoutAt: "2026-10-01T18:30:00Z" })).toBe("08:30");
    expect(formatLogDuration({ loginAt: "2026-10-01T10:00:00Z", logoutAt: null })).toBeNull();
    expect(formatLogTime("2026-10-01T18:07:35.000Z")).toBe("11:07:35");
  });
});
