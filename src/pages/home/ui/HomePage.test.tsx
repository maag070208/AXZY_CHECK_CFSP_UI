import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

/**
 * Accesos rápidos por rol.
 *
 * Qué rol entra al monitoreo en vivo ya no se decide aquí, sino en
 * `app/routing/HomeRoute` (una página no puede importar otra): esos casos
 * viven en `HomeRoute.test.tsx`.
 */
describe("HomePage (accesos rápidos)", () => {
  it("un guardia ve sus módulos permitidos", () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomePage />, { store });

    expect(screen.getByText(/^Recorridos$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Incidencias$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Mantenimiento$/i)).toBeInTheDocument();
  });

  it("un administrador no ve los accesos de guardia", () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-admin-token"));
    renderWithProviders(<HomePage />, { store });

    expect(screen.queryByText(/^Recorridos$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Clientes$/i)).not.toBeInTheDocument();
  });

  it("cada tarjeta navega a su módulo", () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomePage />, { store });

    screen.getByText(/^Recorridos$/i).closest("button")?.click();

    expect(mockNavigate).toHaveBeenCalledWith("/rounds");
  });
});
