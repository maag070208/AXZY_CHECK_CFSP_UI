import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { makeStore } from "@core/store/store";
import { renderWithProviders } from "../testing/renderWithProviders";
import "@testing-library/jest-dom";
import { HomeRoute } from "./HomeRoute";

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

// Ambas páginas se aíslan: aquí sólo se comprueba **cuál** se elige.
vi.mock("@pages/dashboard", () => ({
  default: () => <div data-testid="live-dashboard">Monitoreo en vivo</div>,
}));
vi.mock("@pages/home", () => ({
  default: () => <div data-testid="quick-access">Accesos rápidos</div>,
}));

/**
 * La elección de página por rol vive en la capa `app` porque una página no
 * puede importar otra. Estos casos antes estaban en `HomePage.test`.
 */
describe("HomeRoute", () => {
  it.each(["fake-admin-token", "fake-shift-token", "fake-client-token"])(
    "los roles de supervisión ven el monitoreo en vivo (%s)",
    (token) => {
      const store = makeStore();
      store.dispatch(setAuth(token));
      renderWithProviders(<HomeRoute />, { store });

      expect(screen.getByTestId("live-dashboard")).toBeInTheDocument();
      expect(screen.queryByTestId("quick-access")).not.toBeInTheDocument();
    },
  );

  it("un guardia ve los accesos rápidos, no el monitoreo", () => {
    const store = makeStore();
    store.dispatch(setAuth("fake-guard-token"));
    renderWithProviders(<HomeRoute />, { store });

    expect(screen.getByTestId("quick-access")).toBeInTheDocument();
    expect(screen.queryByTestId("live-dashboard")).not.toBeInTheDocument();
  });

  it("sin rol definido cae en los accesos rápidos", () => {
    renderWithProviders(<HomeRoute />, { store: makeStore() });
    expect(screen.getByTestId("quick-access")).toBeInTheDocument();
  });
});
