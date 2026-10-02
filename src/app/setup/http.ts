import { configureHttp } from "@shared/api";
import { logout } from "@core/store/auth/auth.slice";
import store from "@core/store/store";

/**
 * Conecta el cliente HTTP con la sesión y el router.
 *
 * `shared/api` no conoce Redux ni el router a propósito: la capa `app` es la
 * única que los une. Se ejecuta una sola vez, antes de renderizar.
 */
export const setupHttp = (): void => {
  configureHttp({
    getToken: () => store.getState().auth.token,
    onUnauthorized: () => {
      store.dispatch(logout());
      if (window.location.hash !== "#/login") window.location.hash = "#/login";
    },
  });
};
