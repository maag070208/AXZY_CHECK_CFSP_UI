import { render, screen, waitFor } from "@app/core/utils/test-utils";
import RegisterPage from "./RegisterPage";
import { register } from "../services/AuthService";
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

// Mock AuthService
vi.mock("../services/AuthService", () => ({
  register: vi.fn(),
  login: vi.fn(),
}));

describe("RegisterPage (Pruebas del módulo de Registro)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar correctamente los elementos del formulario de registro", () => {
    render(<RegisterPage />);

    expect(screen.getByText("Crear Cuenta")).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrarse/i })).toBeInTheDocument();
  });

  it("debe deshabilitar el botón de registrarse si los campos están vacíos", async () => {
    render(<RegisterPage />);
    const button = screen.getByRole("button", { name: /registrarse/i });
    await waitFor(() => {
      expect(button).toHaveClass("opacity-50");
    });
  });

  it("debe permitir registrarse con datos válidos", async () => {
    const user = userEvent.setup();
    
    vi.mocked(register).mockResolvedValue({
      success: true,
      data: undefined,
      messages: ["Registro exitoso"],
    });

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre/i);
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);
    const button = screen.getByRole("button", { name: /registrarse/i });

    await user.type(nameInput, "Guardia Uno");
    await user.type(usernameInput, "guardia1");
    await user.type(passwordInput, "pass123");
    await user.type(confirmPasswordInput, "pass123");

    await waitFor(() => {
      expect(button).not.toHaveClass("opacity-50");
    });

    await user.click(button);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "Guardia Uno",
        username: "guardia1",
        password: "pass123",
        roleId: "GUARD_ROLE_ID",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("debe mostrar error de contraseña no coincidente", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/nombre/i);
    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/^contraseña/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar contraseña/i);

    await user.type(nameInput, "Guardia Uno");
    await user.type(usernameInput, "guardia1");
    await user.type(passwordInput, "pass123");
    await user.type(confirmPasswordInput, "diferente");

    // Desenfocar para disparar validación
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/las contraseñas deben coincidir/i)).toBeInTheDocument();
    });
  });
});
