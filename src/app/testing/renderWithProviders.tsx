import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import { render, type RenderOptions } from "@testing-library/react";
import React, { type ReactElement } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { makeStore } from "@core/store/store";

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /** Ruta inicial del `MemoryRouter`. */
  route?: string;
  /**
   * Store ya preparado. Útil cuando el test necesita despachar estado ANTES de
   * renderizar (p. ej. fijar la sesión). Si se omite, se crea uno vacío.
   */
  store?: ReturnType<typeof makeStore>;
}

/**
 * Render estándar para tests: tema + store **aislado** + `MemoryRouter`.
 *
 * Usa `MemoryRouter` (no `BrowserRouter`) para poder asertar navegación, y un
 * store nuevo por test para que el estado no se filtre entre casos. Devuelve
 * también el `store` para preparar estado con `dispatch`.
 *
 * @example
 * const store = makeStore();
 * store.dispatch(setAuth(tokenAdmin));
 * renderWithProviders(<IncidentsPage />, { route: "/incidents", store });
 */
export const renderWithProviders = (
  ui: ReactElement,
  { route = "/", store: providedStore, ...options }: RenderWithProvidersOptions = {},
) => {
  const store = providedStore ?? makeStore();

  const result = render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ITThemeProvider>
        <Provider store={store}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </Provider>
      </ITThemeProvider>
    ),
    ...options,
  });

  return { ...result, store };
};
