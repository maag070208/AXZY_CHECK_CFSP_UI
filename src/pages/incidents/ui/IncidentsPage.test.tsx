import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../app/testing/renderWithProviders";
import { makeIncident } from "@entities/incident/__fixtures__";
import type { IncidentsViewModel } from "../model/useIncidentsPage";
import IncidentsPage from "./IncidentsPage";

/**
 * La vista se prueba mockeando el view-model: sólo se verifica el *cableado*
 * (que un control llame al handler correcto). Sin esperas de red, sin diálogos
 * reales y sin depender de textos de la interfaz.
 */
const mockVm = vi.fn();
vi.mock("../model/useIncidentsPage", () => ({
  useIncidentsPage: () => mockVm(),
}));
vi.mock("../model/deps", () => ({ useIncidentsDeps: () => ({}) }));
vi.mock("./IncidentDetailDialog", () => ({ default: () => <div data-testid="detail-dialog" /> }));

const buildVm = (overrides: Partial<IncidentsViewModel> = {}): IncidentsViewModel =>
  ({
    searchTerm: "",
    setSearchTerm: vi.fn(),
    statusFilter: "ALL",
    setStatusFilter: vi.fn(),
    externalFilters: {},
    tableFetch: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    refreshKey: 0,
    refresh: vi.fn(),
    clearFilters: vi.fn(),
    hasFilters: false,
    canResolve: true,
    canDelete: true,
    viewingIncident: null,
    setViewingIncident: vi.fn(),
    incidentToResolve: null,
    requestResolve: vi.fn(),
    cancelResolve: vi.fn(),
    confirmResolve: vi.fn(),
    resolving: false,
    incidentToDelete: null,
    requestDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: vi.fn(),
    deleting: false,
    isPending: () => true,
    ...overrides,
  }) as IncidentsViewModel;

describe("IncidentsPage (vista)", () => {
  beforeEach(() => {
    mockVm.mockReset();
  });

  it("muestra el título del módulo", () => {
    mockVm.mockReturnValue(buildVm());
    renderWithProviders(<IncidentsPage />, { route: "/incidents" });

    // El título aparece en el encabezado y en las migas; se ancla al h1.
    expect(screen.getByRole("heading", { level: 1, name: "Gestión de Incidencias" })).toBeInTheDocument();
  });

  it("propaga lo que se escribe en el buscador al view-model", async () => {
    const setSearchTerm = vi.fn();
    mockVm.mockReturnValue(buildVm({ setSearchTerm }));
    renderWithProviders(<IncidentsPage />, { route: "/incidents" });

    await userEvent.type(screen.getByPlaceholderText("BUSCAR REPORTE..."), "fuga");

    expect(setSearchTerm).toHaveBeenCalled();
  });

  it("abre el diálogo de confirmación cuando el view-model lo pide", () => {
    mockVm.mockReturnValue(buildVm({ incidentToDelete: makeIncident() }));
    renderWithProviders(<IncidentsPage />, { route: "/incidents" });

    expect(screen.getByText("Eliminar Incidencia")).toBeInTheDocument();
  });

  it("no muestra el diálogo de confirmación si no hay incidencia seleccionada", () => {
    mockVm.mockReturnValue(buildVm());
    renderWithProviders(<IncidentsPage />, { route: "/incidents" });

    expect(screen.queryByText("Eliminar Incidencia")).not.toBeInTheDocument();
    expect(screen.queryByText("Resolver Incidencia")).not.toBeInTheDocument();
  });
});
