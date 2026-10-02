/**
 * View-model de Inicio.
 *
 * Los roles de supervisión entran directo al monitoreo en vivo; el resto ve
 * accesos rápidos filtrados por rol.
 */
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppState } from "@app/core/store/store";

/** Accesos rápidos por rol. */
export const HOME_SHORTCUTS = [
  { title: "Recorridos", description: "Supervisión de rondas", icon: "clock", path: "/rounds", roles: ["GUARD", "MAINT"] },
  { title: "Incidencias", description: "Reportes de novedades y emergencias", icon: "warning", path: "/incidents", roles: ["GUARD", "MAINT"] },
  { title: "Mantenimiento", description: "Gestión de reportes técnicos", icon: "wrench", path: "/maintenances", roles: ["GUARD", "MAINT"] },
] as const;

export type HomeShortcutIcon = (typeof HOME_SHORTCUTS)[number]["icon"];

export const useHomePage = () => {
  const navigate = useNavigate();
  const role = useSelector((state: AppState) => state.auth.role) ?? "";

  const cards = useMemo(
    () =>
      HOME_SHORTCUTS.filter((c) => (c.roles as readonly string[]).includes(role)).map((c) => ({
        title: c.title,
        description: c.description,
        icon: c.icon,
        path: c.path,
        action: () => navigate(c.path),
      })),
    [role, navigate],
  );

  return { role, cards };
};

export type HomeViewModel = ReturnType<typeof useHomePage>;
