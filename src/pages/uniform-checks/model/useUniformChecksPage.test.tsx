import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@core/store/store";
import type { IUniformCheck } from "@entities/supervision";
import * as supervision from "@entities/supervision";
import { toUniformApiParams, useUniformChecksPage } from "./useUniformChecksPage";

const searchParams = new URLSearchParams();
const setSearchParams = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useSearchParams: () => [searchParams, setSearchParams] };
});

// La entidad se mockea completa: si falta una export, `vi.mocked()` deja de
// devolver un mock y los tests fallan con "mockResolvedValue is not a function".
vi.mock("@entities/supervision", () => ({
  fetchUniformChecksTable: vi.fn(),
  getUniformCatalog: vi.fn(),
  createUniformCheck: vi.fn(),
  getUniformCheck: vi.fn(),
  deleteUniformCheck: vi.fn(),
}));

const check = (over: Partial<IUniformCheck> = {}) =>
  ({ id: "uc-1", compliant: true, ...over }) as unknown as IUniformCheck;

const render = () =>
  renderHook(() => useUniformChecksPage(), {
    wrapper: ({ children }) => <Provider store={makeStore()}>{children}</Provider>,
  });

describe("toUniformApiParams", () => {
  it("traduce los filtros de columna a los de la API", () => {
    const out = toUniformApiParams({
      page: 2,
      limit: 10,
      filters: {
        guard: "asael",
        clientId: "cli-1",
        compliant: "true",
        shiftDate: [new Date("2026-10-01T12:00:00Z"), new Date("2026-10-05T12:00:00Z")],
      },
    });

    expect(out.page).toBe(2);
    expect(out.filters).toMatchObject({
      search: "asael",
      clientId: "cli-1",
      compliant: "true",
      dateFrom: "2026-10-01",
      dateTo: "2026-10-05",
    });
  });

  it("sin filtros no inventa claves", () => {
    const out = toUniformApiParams({ page: 1, limit: 10, filters: {} });
    expect(out.filters).toEqual({});
  });

  it("tolera un rango de fechas incompleto", () => {
    const out = toUniformApiParams({
      page: 1,
      limit: 10,
      filters: { shiftDate: [new Date("2026-10-01T12:00:00Z"), null] },
    });
    expect(out.filters).toHaveProperty("dateFrom");
    expect(out.filters).not.toHaveProperty("dateTo");
  });
});

describe("useUniformChecksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.delete("nuevo");
    searchParams.delete("detalle");
    vi.mocked(supervision.deleteUniformCheck).mockResolvedValue({
      success: true,
      data: true,
      messages: [],
    });
  });

  it("borrar refresca la tabla y limpia la selección", async () => {
    const { result } = render();

    act(() => result.current.setToDelete(check()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(supervision.deleteUniformCheck).toHaveBeenCalledWith("uc-1");
    expect(result.current.toDelete).toBeNull();
    expect(result.current.reloadKey).toBe(1);
    expect(result.current.deleting).toBe(false);
  });

  it("si falla el borrado no refresca", async () => {
    vi.mocked(supervision.deleteUniformCheck).mockResolvedValue({
      success: false,
      data: false,
      messages: ["Sin permiso"],
    });
    const { result } = render();

    act(() => result.current.setToDelete(check()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.reloadKey).toBe(0);
  });

  it("sin selección no llama a la API", async () => {
    const { result } = render();
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(supervision.deleteUniformCheck).not.toHaveBeenCalled();
  });

  it("abrir con ?detalle carga la revisión", async () => {
    searchParams.set("detalle", "uc-9");
    vi.mocked(supervision.getUniformCheck).mockResolvedValue({
      success: true,
      data: check({ id: "uc-9" }),
      messages: [],
    });

    const { result } = render();
    await act(async () => {});

    expect(supervision.getUniformCheck).toHaveBeenCalledWith("uc-9");
    expect(result.current.detail?.id).toBe("uc-9");
  });

  it("cerrar el detalle limpia el parámetro de la URL", () => {
    searchParams.set("detalle", "uc-9");
    const { result } = render();

    act(() => result.current.closeDetail());

    expect(result.current.detail).toBeNull();
    expect(setSearchParams).toHaveBeenCalledWith({}, { replace: true });
  });

  it("lee los precargados de guardia y fecha de la URL", () => {
    searchParams.set("guardId", "g-1");
    searchParams.set("shiftDate", "2026-10-01");
    const { result } = render();

    expect(result.current.prefillGuardId).toBe("g-1");
    expect(result.current.prefillShiftDate).toBe("2026-10-01");
  });
});
