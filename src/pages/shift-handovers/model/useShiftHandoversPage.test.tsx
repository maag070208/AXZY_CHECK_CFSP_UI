import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@core/store/store";
import type { IShiftHandoverListItem } from "@entities/supervision";
import * as supervision from "@entities/supervision";
import { toHandoverApiParams, useShiftHandoversPage } from "./useShiftHandoversPage";

const searchParams = new URLSearchParams();
const setSearchParams = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useSearchParams: () => [searchParams, setSearchParams] };
});

vi.mock("@entities/supervision", () => ({
  fetchShiftHandoversTable: vi.fn(),
  deleteShiftHandover: vi.fn(),
  getShiftHandover: vi.fn(),
  getHandoverCatalog: vi.fn(),
  createShiftHandover: vi.fn(),
}));

const item = (over: Partial<IShiftHandoverListItem> = {}) =>
  ({ id: "sh-1", ...over }) as unknown as IShiftHandoverListItem;

const render = () =>
  renderHook(() => useShiftHandoversPage(), {
    wrapper: ({ children }) => <Provider store={makeStore()}>{children}</Provider>,
  });

describe("toHandoverApiParams", () => {
  it("traduce los filtros de columna", () => {
    const out = toHandoverApiParams({
      page: 1,
      limit: 10,
      filters: {
        search: "asael",
        clientId: "cli-1",
        shiftDate: [new Date("2026-10-01T12:00:00Z"), new Date("2026-10-03T12:00:00Z")],
      },
    });

    expect(out.filters).toMatchObject({
      search: "asael",
      clientId: "cli-1",
      dateFrom: "2026-10-01",
      dateTo: "2026-10-03",
    });
  });

  it("sin filtros no inventa claves", () => {
    expect(toHandoverApiParams({ page: 1, limit: 10, filters: {} }).filters).toEqual({});
  });

  it("tolera un rango incompleto", () => {
    const out = toHandoverApiParams({
      page: 1,
      limit: 10,
      filters: { shiftDate: [null, new Date("2026-10-03T12:00:00Z")] },
    });
    expect(out.filters).not.toHaveProperty("dateFrom");
    expect(out.filters).toHaveProperty("dateTo");
  });
});

describe("useShiftHandoversPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.delete("detalle");
    vi.mocked(supervision.deleteShiftHandover).mockResolvedValue({
      success: true,
      data: true,
      messages: [],
    });
  });

  it("borrar refresca la tabla y limpia la selección", async () => {
    const { result } = render();

    act(() => result.current.setToDelete(item()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(supervision.deleteShiftHandover).toHaveBeenCalledWith("sh-1");
    expect(result.current.toDelete).toBeNull();
    expect(result.current.reloadKey).toBe(1);
    expect(result.current.deleting).toBe(false);
  });

  it("si falla el borrado no refresca", async () => {
    vi.mocked(supervision.deleteShiftHandover).mockResolvedValue({
      success: false,
      data: false,
      messages: ["Sin permiso"],
    });
    const { result } = render();

    act(() => result.current.setToDelete(item()));
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
    expect(supervision.deleteShiftHandover).not.toHaveBeenCalled();
  });

  it("abrir con ?detalle arranca con el detalle abierto", () => {
    searchParams.set("detalle", "sh-9");
    const { result } = render();
    expect(result.current.detailId).toBe("sh-9");
  });

  it("cerrar el detalle limpia el parámetro de la URL", () => {
    searchParams.set("detalle", "sh-9");
    const { result } = render();

    act(() => result.current.closeDetail());

    expect(result.current.detailId).toBeNull();
    expect(setSearchParams).toHaveBeenCalledWith({}, { replace: true });
  });
});
