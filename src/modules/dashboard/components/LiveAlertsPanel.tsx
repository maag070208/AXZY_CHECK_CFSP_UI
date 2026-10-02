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
import { ILiveAlert, LiveAlertSeverity, LiveAlertType } from "@app/core/types/supervision.types";
import { timeAgo } from "@app/core/utils/supervision.utils";

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
    row: "bg-rose-50/70 border-rose-200/80 hover:border-rose-300 hover:bg-rose-50",
    bar: "bg-rose-500",
    icon: "bg-rose-600 text-white",
    time: "text-rose-600",
  },
  high: {
    row: "bg-amber-50/60 border-amber-200/80 hover:border-amber-300 hover:bg-amber-50",
    bar: "bg-amber-500",
    icon: "bg-amber-500 text-white",
    time: "text-amber-700",
  },
  medium: {
    row: "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70",
    bar: "bg-slate-300",
    icon: "bg-slate-100 text-slate-500",
    time: "text-slate-400",
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
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
          <FaCheckCircle size={22} />
        </span>
        <ITText className="text-sm font-black uppercase tracking-wider text-slate-700">Todo en orden</ITText>
        <ITText className="mt-1 text-xs font-medium text-slate-400">
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
                  <ITText as="span" className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {meta.label}
                  </ITText>
                  {a.at && (
                    <ITText as="span" className={`text-[10px] font-bold ${style.time}`}>
                      · {timeAgo(a.at)}
                    </ITText>
                  )}
                </span>
                <ITText as="span" className="block truncate text-[13px] font-bold leading-tight text-slate-800">
                  {a.title}
                </ITText>
                {subtitle && (
                  <ITText as="span" className="block truncate text-[11px] font-medium text-slate-500">
                    {subtitle}
                  </ITText>
                )}
              </span>

              <FaChevronRight
                className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-slate-500"
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
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
    }`}
  >
    {label}
  </button>
);
