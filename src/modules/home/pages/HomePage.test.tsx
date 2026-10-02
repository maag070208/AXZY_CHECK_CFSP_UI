import { render, screen, store } from "@app/core/utils/test-utils";
import HomePage from "./HomePage";
import { vi } from "vitest";
import { setAuth, logout } from "@app/core/store/auth/auth.slice";
import "@testing-library/jest-dom";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-jwt", () => ({
  decodeToken: vi.fn((token: string) => {
    const roles: Record<string, string> = {
      "fake-admin-token": "ADMIN",
      "fake-shift-token": "SHIFT",
      "fake-client-token": "RESDN",
      "fake-guard-token": "GUARD",
    };
    return roles[token] ? { id: 1, name: "Usuario", role: roles[token] } : null;
  }),
  isExpired: vi.fn(() => false),
}));

// El monitoreo en vivo hace peticiones y usa mapas: se prueba por separado.
vi.mock("@modules/dashboard/pages/DashboardPage", () => ({
  default: () => <div data-testid="live-dashboard">Monitoreo en vivo</div>,
}));

describe("HomePage (Inicio por rol)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(logout());
  });

  it.each(["fake-admin-token", "fake-shift-token", "fake-client-token"])(
    "los roles de supervisión ven el monitoreo en vivo (%s)",
    (token) => {
      store.dispatch(setAuth(token));
      render(<HomePage />);
      expect(screen.getByTestId("live-dashboard")).toBeInTheDocument();
    },
  );

  it("un guardia ve accesos rápidos a sus módulos y no el monitoreo", () => {
    store.dispatch(setAuth("fake-guard-token"));
    render(<HomePage />);
    expect(screen.queryByTestId("live-dashboard")).not.toBeInTheDocument();
    expect(screen.getByText(/^Recorridos$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Incidencias$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Clientes$/i)).not.toBeInTheDocument();
  });
});
