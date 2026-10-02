/**
 * Decide qué se muestra en `/home` según el rol.
 *
 * Vive en la capa `app` porque **una página no puede importar otra**: antes
 * `pages/home` renderizaba `pages/dashboard`, lo que rompía la regla de
 * fronteras. Elegir la ruta es responsabilidad del enrutado.
 */
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import DashboardPage from "@pages/dashboard";
import HomePage from "@pages/home";

/** Roles que supervisan la operación: entran directo al monitoreo en vivo. */
export const DASHBOARD_ROLES = ["ADMIN", "LIDER", "SHIFT", "RESDN"];

export const HomeRoute = () => {
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  return DASHBOARD_ROLES.includes(role) ? <DashboardPage /> : <HomePage />;
};
