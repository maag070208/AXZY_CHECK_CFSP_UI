import { ITText } from "@axzydev/axzy_ui_system";
import { useMemo, useState } from "react";
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
import { SURFACE, TONES } from "@shared/ui";

const TYPE_META: Record<LiveAlertType, { label: string; icon: React.ReactNode; route: (a: ILiveAlert) => string }> = {
  PANIC: { label: "Pánico", icon: <FaBell />, route: () => "/panic-alerts" },
  HANDOVER_OVERDUE: { label: "Entregas", icon: <FaClipboardCheck />, route: () => "/shift-planning" },
  UNIFORM_OVERDUE: { label: "Uniformes", icon: <FaTshirt />, route: () => "/shift-planning" },
  ROUND_STALLED: { label: "Rondas", icon: <FaRoute />, route: (a) => (a.refId ? `/rounds/${a.refId}` : "/rounds") },
  ROUND_ABANDONED: { label: "Sin cerrar", icon: <FaHourglassHalf />, route: (a) => (a.refId ? `/rounds/${a.refId}` : "/rounds") },
  INCIDENT_OPEN: { label: "Incidencias", icon: <FaExclamationTriangle />, route: () => "/incidents" },
};

/** La severidad define color de fila, barra lateral, tile de icono y hora. */
const SEVERITY_STYLE: Record<LiveAlertSeverity, { row: string; bar: string; icon: string; time: string }> = {
  critical: {
    row: `${TONES.danger.soft} border-danger-200 hover:border-danger-300 dark:hover:border-danger-700`,
    bar: TONES.danger.bar,
    icon: `${TONES.danger.solid}`,
    time: TONES.danger.text,
  },
  high: {
    row: `${TONES.warning.soft} border-warning-200 hover:border-warning-300 dark:hover:border-warning-700`,
    bar: TONES.warning.bar,
    icon: TONES.warning.solid,
    time: TONES.warning.text,
  },
  medium: {
    row: "bg-white border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-secondary-600 dark:hover:bg-secondary-800/60",
    bar: TONES.neutral.bar,
    icon: "bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-300",
    time: "text-secondary-400 dark:text-secondary-500",
  },
};

/** Feed de lo que requiere atención ahora, ordenado por severidad. */
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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${TONES.success.soft} ${TONES.success.text} ${TONES.success.softRing}`}>
          <FaCheckCircle size={22} />
        </span>
        <ITText className="text-sm font-black uppercase tracking-wider text-secondary-700 dark:text-secondary-200">
          Todo en orden
        </ITText>
        <ITText className="mt-1 text-xs font-medium text-secondary-400">
          No hay nada que requiera atención en este momento.
        </ITText>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {counts.size > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip active={typeFilter === "ALL"} onClick={() => setTypeFilter("ALL")} label={`Todas · ${alerts.length}`} />
          {[...counts.entries()].map(([type, count]) => (
            <Chip
              key={type}
              active={typeFilter === type}
              onClick={() => setTypeFilter(type)}
              label={`${TYPE_META[type].label} · ${count}`}
            />
          ))}
        </div>
      )}

      <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {visible.map((a) => {
          const style = SEVERITY_STYLE[a.severity];
          const meta = TYPE_META[a.type];
          const subtitle = [a.clientName, a.detail].filter(Boolean).join(" · ");

          return (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate(meta.route(a))}
              className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border py-2.5 pl-4 pr-3 text-left transition-all duration-200 ${style.row}`}
            >
              <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full ${style.bar}`} />

              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] shadow-sm ${style.icon}`}>
                {meta.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center gap-2">
                  <ITText as="span" className={SURFACE.microLabel}>
                    {meta.label}
                  </ITText>
                  {a.at && (
                    <ITText as="span" className={`text-[10px] font-bold ${style.time}`}>
                      · {timeAgo(a.at)}
                    </ITText>
                  )}
                </span>
                <ITText as="span" className={`block truncate text-[13px] font-bold leading-tight ${SURFACE.strong}`}>
                  {a.title}
                </ITText>
                {subtitle && (
                  <ITText as="span" className="block truncate text-[11px] font-medium text-secondary-500 dark:text-secondary-400">
                    {subtitle}
                  </ITText>
                )}
              </span>

              <FaChevronRight
                className="shrink-0 text-secondary-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-secondary-500"
                size={11}
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
