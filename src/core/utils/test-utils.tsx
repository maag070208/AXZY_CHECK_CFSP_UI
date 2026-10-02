/**
 * Punto de entrada legacy para tests. Mantiene el alias `render` para no
 * romper los tests existentes, pero **ya usa el wrapper aislado**.
 *
 * Antes montaba el store singleton y `BrowserRouter`: el estado se filtraba
 * entre archivos y `ClientsPage.test` fallaba de forma intermitente. Ahora
 * delega en `renderWithProviders` (store nuevo por test + `MemoryRouter`).
 *
 * @deprecated Importa `renderWithProviders` de `app/testing/renderWithProviders`.
 */
export * from "@testing-library/react";
export { renderWithProviders as render } from "../../app/testing/renderWithProviders";
export { renderWithProviders } from "../../app/testing/renderWithProviders";
