import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeStore } from "@core/store/store";
import type { ReportConfigRow } from "@entities/report";
import * as reportApi from "@entities/report";
import { useReportsPage } from "./useReportsPage";

vi.mock("@entities/report", () => ({
  fetchReportConfigurationsTable: vi.fn(),
  deleteReportConfiguration: vi.fn(),
  generateAdministrativeMatrixPdf: vi.fn(),
}));

vi.mock("@app/core/hooks/catalog.hook", () => ({ useCatalog: () => ({ data: [] }) }));

const row = (over: Partial<ReportConfigRow> = {}): ReportConfigRow =>
  ({
    id: "cfg-1",
    name: "Matriz administrativa",
    reportType: "ADMINISTRATIVE_MATRIX",
    configuration: { startDate: "2026-10-01", endDate: "2026-10-31" },
    ...over,
  }) as ReportConfigRow;

const render = () =>
  renderHook(() => useReportsPage(), {
    wrapper: ({ children }) => <Provider store={makeStore()}>{children}</Provider>,
  });

describe("useReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reportApi.fetchReportConfigurationsTable).mockResolvedValue({ data: [], total: 0 });
    vi.mocked(reportApi.deleteReportConfiguration).mockResolvedValue({ success: true, data: true, messages: [] });
    vi.mocked(reportApi.generateAdministrativeMatrixPdf).mockResolvedValue({ success: true, data: true, messages: [] });
  });

  it("la tabla recibe `data`/`total` y guarda el conteo", async () => {
    vi.mocked(reportApi.fetchReportConfigurationsTable).mockResolvedValue({ data: [row()], total: 7 });
    const { result } = render();

    let out: { data: ReportConfigRow[]; total: number } | undefined;
    await act(async () => {
      out = await result.current.fetchData({ page: 1, limit: 10, filters: {} });
    });

    expect(out?.total).toBe(7);
    expect(result.current.savedCount).toBe(7);
  });

  it("el buscador y el cliente viajan como filtros, no como claves sueltas", async () => {
    const { result } = render();

    act(() => {
      result.current.setSearchTerm("octubre");
      result.current.setSelectedClientId("cli-3");
    });

    await act(async () => {
      await result.current.fetchData({ page: 1, limit: 10, filters: {} });
    });

    expect(reportApi.fetchReportConfigurationsTable).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ search: "octubre", clientId: "cli-3" }),
      }),
    );
  });

  it("generar el reporte usa el nombre del archivo y avisa", async () => {
    const { result } = render();

    await act(async () => {
      await result.current.handleGenerateSavedReport(row());
    });

    expect(reportApi.generateAdministrativeMatrixPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        fileName: expect.stringContaining("Matriz_administrativa"),
      }),
    );
    expect(result.current.isGenerating).toBeNull();
  });

  it("sin rango de fechas no llama al backend", async () => {
    const { result } = render();

    await act(async () => {
      await result.current.handleGenerateSavedReport(row({ configuration: {} }));
    });

    expect(reportApi.generateAdministrativeMatrixPdf).not.toHaveBeenCalled();
  });

  it("un tipo de reporte no soportado no llama al backend", async () => {
    const { result } = render();

    await act(async () => {
      await result.current.handleGenerateSavedReport(row({ reportType: "OTRO" }));
    });

    expect(reportApi.generateAdministrativeMatrixPdf).not.toHaveBeenCalled();
  });

  it("editar abre el modal sólo para la matriz administrativa", () => {
    const { result } = render();

    act(() => result.current.handleEdit(row()));
    expect(result.current.aperturaCierreOpen).toBe(true);
    expect(result.current.configToEdit?.id).toBe("cfg-1");
  });

  it("eliminar refresca y limpia la selección", async () => {
    const { result } = render();

    act(() => result.current.setConfigToDelete(row()));
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(reportApi.deleteReportConfiguration).toHaveBeenCalledWith("cfg-1");
    expect(result.current.configToDelete).toBeNull();
    expect(result.current.refreshKey).toBe(1);
  });

  it("sin selección no llama a la API", async () => {
    const { result } = render();
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(reportApi.deleteReportConfiguration).not.toHaveBeenCalled();
  });

  it("cerrar el modal refresca la tabla", () => {
    const { result } = render();
    const before = result.current.refreshKey;

    act(() => result.current.closeModal());

    expect(result.current.aperturaCierreOpen).toBe(false);
    expect(result.current.refreshKey).toBe(before + 1);
  });
});
