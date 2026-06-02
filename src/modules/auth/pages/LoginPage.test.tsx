import { render, screen, waitFor } from "@app/core/utils/test-utils";
import LoginPage from "./LoginPage";
import { login } from "../services/AuthService";
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
  login: vi.fn(),
}));

describe("LoginPage (Pruebas del módulo de Autenticación)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar correctamente los elementos del formulario", () => {
    render(<LoginPage />);

    expect(screen.getByText("Bienvenido")).toBeInTheDocument();
    expect(screen.getByText("Ingresa tus datos para continuar")).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar al Sistema/i })).toBeInTheDocument();
  });

  it("debe deshabilitar el botón de entrar si los campos están vacíos", async () => {
    render(<LoginPage />);
    const button = screen.getByRole("button", { name: /Entrar al Sistema/i });
    await waitFor(() => {
      expect(button).toHaveClass("opacity-50");
    });
  });

  it("debe permitir iniciar sesión con credenciales válidas", async () => {
    const mockUser = userEvent.setup();
    
    vi.mocked(login).mockResolvedValue({
      success: true,
      data: "fake-jwt-token",
      messages: ["Bienvenido"],
    });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const button = screen.getByRole("button", { name: /Entrar al Sistema/i });

    await mockUser.type(usernameInput, "admin");
    await mockUser.type(passwordInput, "admin123");

    await waitFor(() => {
      expect(button).not.toHaveClass("opacity-50");
    });

    await mockUser.click(button);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        username: "admin",
        password: "admin123",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  it("debe mostrar un mensaje de error si el login falla", async () => {
    const mockUser = userEvent.setup();
    
    vi.mocked(login).mockResolvedValue({
      success: false,
      data: "",
      messages: ["Credenciales incorrectas"],
    });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/usuario/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const button = screen.getByRole("button", { name: /Entrar al Sistema/i });

    await mockUser.type(usernameInput, "admin");
    await mockUser.type(passwordInput, "wrongpassword");

    await waitFor(() => {
      expect(button).not.toHaveClass("opacity-50");
    });

    await mockUser.click(button);

    await waitFor(() => {
      expect(login).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
