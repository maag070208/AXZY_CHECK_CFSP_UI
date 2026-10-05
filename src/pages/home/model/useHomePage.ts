/**
 * View-model de Inicio.
 *
 * Los roles de supervisión entran directo al monitoreo en vivo; el resto ve un
 * resumen de su turno y accesos rápidos filtrados por rol. Toda la lógica de
 * datos vive aquí: la vista sólo renderiza.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { Round } from "@entities/round";
import { AppState } from "@app/core/store/store";
import type { HomeCountFilters, HomeDeps } from "./deps";

/** Accesos rápidos por rol. */
export const HOME_SHORTCUTS = [
  { title: "Recorridos", description: "Supervisión de rondas", icon: "clock", path: "/rounds", roles: ["GUARD", "MAINT"] },
  { title: "Incidencias", description: "Reportes de novedades y emergencias", icon: "warning", path: "/incidents", roles: ["GUARD", "MAINT"] },
  { title: "Mantenimiento", description: "Gestión de reportes técnicos", icon: "wrench", path: "/maintenances", roles: ["GUARD", "MAINT"] },
] as const;

export type HomeShortcutIcon = (typeof HOME_SHORTCUTS)[number]["icon"];

/** Nombre legible del rol para el badge del encabezado. */
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  LIDER: "Líder operativo",
  SHIFT: "Jefe de turno",
  RESDN: "Residente",
  GUARD: "Guardia",
  MAINT: "Mantenimiento",
};

export interface HomeShortcut {
  title: string;
  description: string;
  icon: HomeShortcutIcon;
  path: string;
}

export interface HomeSummary {
  /** Incidencias propias pendientes; `null` mientras carga. */
  incidents: number | null;
  /** Mantenimientos propios pendientes; `null` mientras carga. */
  maintenances: number | null;
  /** Recorrido en curso del usuario, si lo hay. */
  round: Round | null;
}

const greetingForHour = (hour: number): string => {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

const formatToday = (date: Date): string => {
  // `Intl` en vez de formato hardcodeado (guideline de locale).
  const label = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const useHomePage = ({
  countIncidents,
  countMaintenances,
  getCurrentRound,
}: HomeDeps) => {
  const name = useSelector((state: AppState) => state.auth.name);
  const role = useSelector((state: AppState) => state.auth.role);
  const userId = useSelector((state: AppState) => state.auth.id);

  const roleKey = role ?? "";

  const cards = useMemo<HomeShortcut[]>(
    () =>
      HOME_SHORTCUTS.filter((c) => (c.roles as readonly string[]).includes(roleKey)).map((c) => ({
        title: c.title,
        description: c.description,
        icon: c.icon,
        path: c.path,
      })),
    [roleKey],
  );

  const now = useMemo(() => new Date(), []);

  const [summary, setSummary] = useState<HomeSummary>({ incidents: null, maintenances: null, round: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Sólo lo propio: el home es personal, no un panel de operación global.
    const scope: HomeCountFilters = userId ? { guardId: userId } : {};

    void Promise.all([
      countIncidents({ status: "PENDING", ...scope }),
      countMaintenances({ status: "PENDING", ...scope }),
      getCurrentRound(),
    ])
      .then(([incidents, maintenances, roundRes]) => {
        if (!active) return;
        setSummary({
          incidents,
          maintenances,
          round: roundRes.success ? roundRes.data : null,
        });
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("No se pudo cargar el resumen de tu turno.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [countIncidents, countMaintenances, getCurrentRound, userId, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  return {
    greeting: greetingForHour(now.getHours()),
    userName: name?.trim().split(/\s+/)[0] ?? "",
    dateLabel: formatToday(now),
    roleLabel: ROLE_LABELS[roleKey] ?? roleKey,
    cards,
    summary,
    loading,
    error,
    refresh,
  };
};

export type HomeViewModel = ReturnType<typeof useHomePage>;
