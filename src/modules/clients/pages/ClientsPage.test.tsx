import { render, screen, waitFor, fireEvent } from "@app/core/utils/test-utils";
import ClientsPage from "./ClientsPage";
import * as clientsService from "../services/ClientsService";
import { vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ClientsService
vi.mock("../services/ClientsService", () => ({
  getPaginatedClients: vi.fn(),
  deleteClient: vi.fn(),
}));

const mockClients = {
  rows: [
    {
      id: "client-uuid-1",
      name: "Cliente Alfa",
      contactName: "Juan Pérez",
      contactPhone: "555-0199",
      active: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      deletedAt: null,
    },
    {
      id: "client-uuid-2",
      name: "Cliente Beta",
      contactName: "María López",
      contactPhone: "555-0188",
      active: false,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      deletedAt: null,
    },
  ],
  total: 2,
};

describe("ClientsPage (Pruebas del módulo de Clientes)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientsService.getPaginatedClients).mockResolvedValue({
      success: true,
      data: mockClients,
      messages: [],
    });
  });

  it("debe renderizar el encabezado y el filtro de estado", async () => {
    render(<ClientsPage />);

    expect(screen.getByText("Directorio de Clientes")).toBeInTheDocument();
    expect(screen.getByText("Gestión de clientes y sus ubicaciones")).toBeInTheDocument();
    expect(screen.getByText("TODOS")).toBeInTheDocument();
  });

  it("debe mostrar los clientes paginados en la tabla", async () => {
    render(<ClientsPage />);

    await waitFor(() => {
      expect(screen.getByText(/cliente alfa/i)).toBeInTheDocument();
      expect(screen.getByText(/cliente beta/i)).toBeInTheDocument();
      expect(screen.getByText(/juan pérez/i)).toBeInTheDocument();
      expect(screen.getByText(/maría lópez/i)).toBeInTheDocument();
    });
  });

  it("debe abrir el modal de confirmación y eliminar un cliente", async () => {
    const user = userEvent.setup();
    vi.mocked(clientsService.deleteClient).mockResolvedValue({
      success: true,
      data: undefined,
      messages: ["Cliente eliminado"],
    });

    render(<ClientsPage />);

    // Esperar a que carguen los datos
    await screen.findByText(/cliente alfa/i);

    // Buscar botones de eliminar (ícono FaTrash)
    const deleteButtons = screen.getAllByTitle("Eliminar");
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Hacer clic en el botón de eliminar del primer cliente
    await user.click(deleteButtons[0]);

    // Verificar que se abra el modal de confirmación
    expect(screen.getByText("Confirmar Eliminación")).toBeInTheDocument();
    expect(screen.getByText(/¿Estás seguro de eliminar el cliente seleccionado?/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /Eliminar Cliente/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(clientsService.deleteClient).toHaveBeenCalledWith("client-uuid-1");
    });
  });
});
