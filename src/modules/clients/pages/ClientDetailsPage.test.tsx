import { render, screen, waitFor } from "@app/core/utils/test-utils";
import ClientDetailsPage from "./ClientDetailsPage";
import * as clientsService from "../services/ClientsService";
import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom";

// Mock useParams & useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: "client-uuid-1" }),
    useNavigate: () => mockNavigate,
  };
});

// Mock ClientsService
vi.mock("../services/ClientsService", () => ({
  getClientById: vi.fn(),
}));

// Mock sub-tabs
vi.mock("../components/details/ClientLocationsTab", () => ({
  ClientLocationsTab: () => <div data-testid="locations-tab">Ubicaciones Tab Mock</div>,
}));
vi.mock("../components/details/ClientZonesTab", () => ({
  ClientZonesTab: () => <div data-testid="zones-tab">Zonas Tab Mock</div>,
}));
vi.mock("../components/details/ClientGuardsTab", () => ({
  ClientGuardsTab: () => <div data-testid="guards-tab">Guardias Tab Mock</div>,
}));

const mockClient = {
  id: "client-uuid-1",
  name: "Cliente Alfa",
  rfc: "ALFA123456HM8",
  contactName: "Juan Pérez",
  contactPhone: "555-0199",
  active: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  deletedAt: null,
};

describe("ClientDetailsPage (Pruebas de Detalle de Cliente)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe mostrar el cargando y luego la información del cliente", async () => {
    // Configurar respuesta de API exitosa
    vi.mocked(clientsService.getClientById).mockResolvedValue({
      success: true,
      data: mockClient,
      messages: [],
    });

    render(<ClientDetailsPage />);

    // Verificar que cargue la información del cliente
    await waitFor(() => {
      expect(screen.getByText("Cliente Alfa")).toBeInTheDocument();
      expect(screen.getByText(/RFC: ALFA123456HM8/i)).toBeInTheDocument();
      expect(screen.getByText(/CONTACTO: JUAN PÉREZ/i)).toBeInTheDocument();
      expect(screen.getByText("ACTIVO")).toBeInTheDocument();
    });

    // Validar presencia de las pestañas
    expect(screen.getByText("Ubicaciones")).toBeInTheDocument();
    expect(screen.getByText("Zonas / Recurrentes")).toBeInTheDocument();
    expect(screen.getByText("Guardias Asignados")).toBeInTheDocument();
  });

  it("debe mostrar estado extraviado si el cliente no existe", async () => {
    // Configurar respuesta de API fallida (cliente no existe)
    vi.mocked(clientsService.getClientById).mockResolvedValue({
      success: false,
      data: null as any,
      messages: ["No encontrado"],
    });

    render(<ClientDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Extraviado")).toBeInTheDocument();
      expect(screen.getByText(/El registro que buscas no existe o ha sido removido del sistema/i)).toBeInTheDocument();
    });
  });
});
