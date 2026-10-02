import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../app/testing/renderWithProviders";
import { makeMaintenance } from "@entities/maintenance/__fixtures__";
import type { MaintenancesViewModel } from "../model/useMaintenancesPage";
import MaintenancesPage from "./MaintenancesPage";

const mockVm = vi.fn();
vi.mock("../model/useMaintenancesPage", () => ({
  useMaintenancesPage: () => mockVm(),
}));
vi.mock("../model/deps", () => ({ useMaintenancesDeps: () => ({}) }));
vi.mock("./MaintenanceDetailDialog", () => ({ default: () => <div data-testid="detail-dialog" /> }));

const buildVm = (overrides: Partial<MaintenancesViewModel> = {}): MaintenancesViewModel =>
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
    viewingMaintenance: null,
    setViewingMaintenance: vi.fn(),
    maintenanceToResolve: null,
    requestResolve: vi.fn(),
    cancelResolve: vi.fn(),
    confirmResolve: vi.fn(),
    resolving: false,
    maintenanceToDelete: null,
    requestDelete: vi.fn(),
    cancelDelete: vi.fn(),
    confirmDelete: vi.fn(),
    deleting: false,
    ...overrides,
  }) as MaintenancesViewModel;

describe("MaintenancesPage (vista)", () => {
  beforeEach(() => mockVm.mockReset());

  it("muestra el título del módulo", () => {
    mockVm.mockReturnValue(buildVm());
    renderWithProviders(<MaintenancesPage />, { route: "/maintenances" });

    expect(
      screen.getByRole("heading", { level: 1, name: "Gestión de Mantenimientos" }),
    ).toBeInTheDocument();
  });

  it("abre el diálogo de resolución cuando el view-model lo pide", () => {
    mockVm.mockReturnValue(buildVm({ maintenanceToResolve: makeMaintenance() }));
    renderWithProviders(<MaintenancesPage />, { route: "/maintenances" });

    expect(screen.getByText("Resolver Mantenimiento")).toBeInTheDocument();
  });

  it("no muestra confirmaciones sin selección", () => {
    mockVm.mockReturnValue(buildVm());
    renderWithProviders(<MaintenancesPage />, { route: "/maintenances" });

    expect(screen.queryByText("Resolver Mantenimiento")).not.toBeInTheDocument();
    expect(screen.queryByText("Eliminar Registro")).not.toBeInTheDocument();
  });
});
