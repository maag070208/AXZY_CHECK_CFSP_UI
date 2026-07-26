import { ITBadget, ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaChevronRight,
  FaExclamationTriangle,
  FaTools,
  FaUserShield,
} from "react-icons/fa";
import { IActivityItem } from "../services/DashboardService";
import { activityItemToHref } from "./activityNavigation";

const typeMeta: Record<
  IActivityItem["type"],
  {
    icon: ReactNode;
    color: "danger" | "warning" | "info" | "purple" | "primary" | "secondary";
    label: string;
  }
> = {
  panic: { icon: <FaBell />, color: "danger", label: "EMERGENCIA" },
  incident: {
    icon: <FaExclamationTriangle />,
    color: "warning",
    label: "INCIDENCIA",
  },
  maintenance: {
    icon: <FaTools />,
    color: "info",
    label: "MANTENIMIENTO",
  },
  discipline: {
    icon: <FaUserShield />,
    color: "purple",
    label: "DISCIPLINA",
  },
  round: { icon: <FaUserShield />, color: "primary", label: "RONDA" },
  kardex: { icon: <FaUserShield />, color: "secondary", label: "KARDEX" },
};

interface ActivityItemRowProps {
  item: IActivityItem;
}

const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });
};

const iconWrapClass: Record<IActivityItem["type"], string> = {
  panic: "bg-rose-50 text-rose-600 ring-rose-100",
  incident: "bg-amber-50 text-amber-600 ring-amber-100",
  maintenance: "bg-sky-50 text-sky-600 ring-sky-100",
  discipline: "bg-violet-50 text-violet-600 ring-violet-100",
  round: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  kardex: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const ActivityItemRow = ({ item }: ActivityItemRowProps) => {
  const navigate = useNavigate();
  const meta = typeMeta[item.type];
  const href = activityItemToHref(item);
  const clickable = href !== null;

  const handleClick = () => {
    if (href) navigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const isPanic = item.type === "panic";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      aria-label={clickable ? `Ver detalle de ${meta.label}` : undefined}
      className={`
        group relative flex items-center gap-4 p-3.5 rounded-xl
        border transition-all duration-300 ease-out
        ${
          clickable
            ? "cursor-pointer border-slate-200/70 hover:border-slate-300 hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 active:translate-y-0"
            : "border-slate-200/70 bg-white"
        }
        ${isPanic ? "bg-rose-50/40 border-rose-200/80" : "bg-white"}
      `}
    >
      <div
        className={`
          w-11 h-11 rounded-xl flex items-center justify-center shrink-0
          ring-1 transition-all duration-300 text-base
          ${iconWrapClass[item.type]}
          ${clickable ? "group-hover:scale-105" : ""}
        `}
      >
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ITBadget label={meta.label} color={meta.color} size="small" />
          <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <ITText className="text-sm font-bold text-slate-900 truncate leading-tight">
          {item.title}
        </ITText>
        {item.guardName && (
          <ITText className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {item.guardName}
            {item.clientName ? ` · ${item.clientName}` : ""}
          </ITText>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPanic && item.latitude != null && item.longitude != null && (
          <a
            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-700 hover:text-white px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-600 ring-1 ring-rose-200 transition-colors"
          >
            Ubicación
          </a>
        )}

        {clickable && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-emerald-50 transition-colors">
            <FaChevronRight
              size={12}
              className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all duration-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};
