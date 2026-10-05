import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { makeStore } from "@core/store/store";
import { renderWithProviders } from "../../../app/testing/renderWithProviders";
import "@testing-library/jest-dom";
import HomePage from "./HomePage";

/**
 * Las dependencias se mockean (objeto estable) para que el efecto no se
 * re-dispare en cada render y no se golpee la API real.
 */
vi.mock("../model/deps", () => {
  const deps = {
    countIncidents: vi.fn().mockResolvedValue(3),
    countMaintenances: vi.fn().mockResolvedValue(1),
    getCurrentRound: vi.fn().mockResolvedValue({ success: true, data: null, messages: [] }),
  };
  return { useHomeDeps: () => deps };
});

vi.mock("react-jwt", () => ({
  decodeToken: vi.fn((token: string) => {
    const roles: Record<string, string> = {
      "fake-admin-token": "ADMIN",
      "fake-shift-token": "SHIFT",
      "fake-client-token": "RESDN",
      "fake-guard-token": "GUARD",
    };
    return roles[token] ? { id: "user-1", name: "Usuario", role: roles[token] } : null;
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
  it("un guardia ve sus módulos permitidos", async () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomePage />, { store });

    expect(await screen.findByText(/^Recorridos$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Incidencias$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Mantenimiento$/i)).toBeInTheDocument();
  });

  it("un administrador no ve los accesos de guardia y muestra el estado vacío", async () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-admin-token"));
    renderWithProviders(<HomePage />, { store });

    await screen.findByText(/accesos rápidos asignados/i);
    expect(screen.queryByText(/^Recorridos$/i)).not.toBeInTheDocument();
  });

  it("cada tarjeta navega a su módulo mediante un enlace", async () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomePage />, { store });

    const link = (await screen.findByText(/^Recorridos$/i)).closest("a");
    expect(link).toHaveAttribute("href", "/rounds");
  });

  it("muestra el resumen del turno con los conteos", async () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomePage />, { store });

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
    expect(screen.getByText(/incidencias abiertas/i)).toBeInTheDocument();
    expect(screen.getByText(/recorrido actual/i)).toBeInTheDocument();
  });
});
