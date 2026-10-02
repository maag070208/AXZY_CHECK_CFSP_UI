import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { makeStore } from "@core/store/store";
import { renderWithProviders } from "../../../app/testing/renderWithProviders";
import "@testing-library/jest-dom";
import HomePage from "./HomePage";

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

/**
 * Cada caso monta su propio store (`renderWithProviders` lo crea), así que el
 * estado de sesión ya no se filtra entre tests ni hay que resetearlo a mano.
 */
describe("HomePage (Inicio por rol)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["fake-admin-token", "fake-shift-token", "fake-client-token"])(
    "los roles de supervisión ven el monitoreo en vivo (%s)",
    (token) => {
      const store = makeStore();
      store.dispatch(setAuth(token));
      renderWithProviders(<HomePage />, { store });

      expect(screen.getByTestId("live-dashboard")).toBeInTheDocument();
    },
  );

  it("un guardia ve accesos rápidos a sus módulos y no el monitoreo", () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomePage />, { store });

    expect(screen.queryByTestId("live-dashboard")).not.toBeInTheDocument();
    expect(screen.getByText(/^Recorridos$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Incidencias$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Clientes$/i)).not.toBeInTheDocument();
  });
});
