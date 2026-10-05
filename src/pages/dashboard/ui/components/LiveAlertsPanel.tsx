import { ITText } from "@axzydev/axzy_ui_system";
import { ReactNode, useMemo, useState } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaChevronRight,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaRoute,
  FaTshirt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ILiveAlert, LiveAlertSeverity, LiveAlertType } from "@entities/supervision";
import { timeAgo } from "@app/core/utils/supervision.utils";
import { TONES } from "@shared/ui";
import { BOARD } from "./board";

const TYPE_META: Record<LiveAlertType, { label: string; icon: ReactNode; route: (a: ILiveAlert) => string }> = {
  PANIC: { label: "Pánico", icon: <FaBell />, route: () => "/panic-alerts" },
  HANDOVER_OVERDUE: { label: "Entregas", icon: <FaClipboardCheck />, route: () => "/shift-planning" },
  UNIFORM_OVERDUE: { label: "Uniformes", icon: <FaTshirt />, route: () => "/shift-planning" },
  ROUND_STALLED: { label: "Rondas", icon: <FaRoute />, route: (a) => (a.refId ? `/rounds/${a.refId}` : "/rounds") },
  ROUND_ABANDONED: { label: "Sin cerrar", icon: <FaHourglassHalf />, route: (a) => (a.refId ? `/rounds/${a.refId}` : "/rounds") },
  INCIDENT_OPEN: { label: "Incidencias", icon: <FaExclamationTriangle />, route: () => "/incidents" },
};

/** La severidad define el tile del icono, el tinte de la fila y la hora. */
const SEVERITY: Record<LiveAlertSeverity, { row: string; tile: string; eyebrow: string }> = {
  critical: {
    row: `${TONES.danger.soft}`,
    tile: TONES.danger.solid,
    eyebrow: TONES.danger.text,
  },
  high: {
    row: "hover:bg-secondary-50 dark:hover:bg-secondary-800/60",
    tile: `${TONES.warning.soft} ${TONES.warning.softText}`,
    eyebrow: TONES.warning.text,
  },
  medium: {
    row: "hover:bg-secondary-50 dark:hover:bg-secondary-800/60",
    tile: `${TONES.neutral.soft} ${TONES.neutral.softText}`,
    eyebrow: "text-secondary-400 dark:text-secondary-500",
  },
};

/** Cola de atención priorizada, con tiles de icono al estilo Reportes. */
export const LiveAlertsPanel = ({ alerts }: { alerts: ILiveAlert[] }) => {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<LiveAlertType | "ALL">("ALL");

  const counts = useMemo(() => {
    const acc = new Map<LiveAlertType, number>();
    alerts.forEach((a) => acc.set(a.type, (acc.get(a.type) ?? 0) + 1));
    return acc;
  }, [alerts]);

  const visible = typeFilter === "ALL" ? alerts : alerts.filter((a) => a.type === typeFilter);

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 px-1 py-8">
        <span className={`${BOARD.tile} h-12 w-12 ${TONES.success.soft} ${TONES.success.softText}`}>
          <FaCheckCircle size={18} />
        </span>
        <div>
          <ITText as="p" className={`text-[13px] font-bold ${BOARD.strong}`}>
            Todo en orden
          </ITText>
          <ITText as="p" className={BOARD.label}>
            Nada requiere atención en este momento.
          </ITText>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {counts.size > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          <Chip active={typeFilter === "ALL"} onClick={() => setTypeFilter("ALL")} label={`Todas · ${alerts.length}`} />
          {[...counts.entries()].map(([type, count]) => (
            <Chip key={type} active={typeFilter === type} onClick={() => setTypeFilter(type)} label={`${TYPE_META[type].label} · ${count}`} />
          ))}
        </div>
      )}

      <div className="max-h-[460px] space-y-1 overflow-y-auto pr-1">
        {visible.map((a) => {
          const style = SEVERITY[a.severity];
          const meta = TYPE_META[a.type];
          const subtitle = [a.clientName, a.detail].filter(Boolean).join(" · ");

          return (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(meta.route(a))}
              className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${style.row}`}
            >
              <span className={`${BOARD.tile} ${style.tile}`}>{meta.icon}</span>

              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center gap-2">
                  <ITText as="span" className={`text-[10px] font-black uppercase tracking-[0.12em] ${style.eyebrow}`}>
                    {meta.label}
                  </ITText>
                  {a.at && (
                    <ITText as="span" className="text-[10px] font-semibold text-secondary-400 dark:text-secondary-500">
                      · {timeAgo(a.at)}
                    </ITText>
                  )}
                </span>
                <ITText as="span" className={`block truncate text-[13px] font-bold leading-tight ${BOARD.strong}`}>
                  {a.title}
                </ITText>
                {subtitle && (
                  <ITText as="span" className={`block truncate text-[11px] ${BOARD.label}`}>
                    {subtitle}
                  </ITText>
                )}
              </span>

              <FaChevronRight
                aria-hidden="true"
                size={11}
                className="shrink-0 text-secondary-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-secondary-500"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors ${
      active
        ? "border-primary-600 bg-primary-600 text-white"
        : "border-secondary-200 bg-white text-secondary-500 hover:border-secondary-300 hover:text-secondary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-400 dark:hover:text-secondary-200"
    }`}
  >
    {label}
  </button>
);
