import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaExclamationTriangle, FaRoute, FaUserShield, FaWrench } from "react-icons/fa";
import { IPendingCounts } from "@entities/supervision";
import { SemanticTone, TONES } from "@shared/ui";
import { BOARD } from "./board";

interface PendingRow {
  key: keyof IPendingCounts;
  label: string;
  route: string;
  tone: SemanticTone;
  icon: ReactNode;
}

const ROWS: PendingRow[] = [
  { key: "panicAlerts", label: "Pánico sin atender", route: "/panic-alerts", tone: "danger", icon: <FaBell /> },
  { key: "incidents", label: "Incidencias abiertas", route: "/incidents", tone: "danger", icon: <FaExclamationTriangle /> },
  { key: "maintenances", label: "Mantenimientos", route: "/maintenances", tone: "warning", icon: <FaWrench /> },
  { key: "disciplines", label: "Disciplina", route: "/guard-discipline", tone: "accent", icon: <FaUserShield /> },
  { key: "activeRounds", label: "Rondas activas", route: "/rounds", tone: "brand", icon: <FaRoute /> },
];

/** Conteo accionable de lo pendiente. Cada fila abre su módulo. */
export const PendingCountsPanel = ({ counts }: { counts: IPendingCounts | null }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      {ROWS.map((row) => {
        const value = counts?.[row.key] ?? 0;
        const active = value > 0;
        const tone = TONES[row.tone];
        return (
          <button
            key={row.key}
            type="button"
            onClick={() => navigate(row.route)}
            className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:bg-secondary-800/60"
          >
            <span className={`${BOARD.tile} ${active ? `${tone.soft} ${tone.softText}` : "bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-500"}`}>
              {row.icon}
            </span>
            <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${active ? BOARD.strong : BOARD.label}`}>
              {row.label}
            </span>
            <span className={`shrink-0 text-2xl font-black leading-none tabular-nums ${active ? tone.text : "text-secondary-300 dark:text-secondary-600"}`}>
              {value}
            </span>
          </button>
        );
      })}
    </div>
  );
};
