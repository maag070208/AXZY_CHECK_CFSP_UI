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
import { SURFACE, TONES } from "@shared/ui";

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

/** Barra de acento y tile del icono: mismo lenguaje visual que las alertas. */
const iconWrapClass: Record<IActivityItem["type"], { tile: string; bar: string }> = {
  panic: { tile: TONES.danger.solid, bar: TONES.danger.bar },
  incident: { tile: `${TONES.warning.soft} ${TONES.warning.softText}`, bar: TONES.warning.bar },
  maintenance: { tile: `${TONES.info.soft} ${TONES.info.softText}`, bar: TONES.info.bar },
  discipline: { tile: `${TONES.accent.soft} ${TONES.accent.softText}`, bar: TONES.accent.bar },
  round: { tile: `${TONES.brand.soft} ${TONES.brand.softText}`, bar: TONES.brand.bar },
  kardex: { tile: `${TONES.neutral.soft} ${TONES.neutral.softText}`, bar: TONES.neutral.bar },
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
        group relative flex items-center gap-3 overflow-hidden rounded-xl border py-2.5 pl-4 pr-3
        transition-all duration-200 ease-out
        ${clickable ? "cursor-pointer hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300" : ""}
        ${
          isPanic
            ? `${TONES.danger.soft} border-danger-200`
            : "border-secondary-200 bg-white hover:border-secondary-300 hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,0.25)] dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-secondary-600"
        }
      `}
    >
      <span className={`absolute inset-y-2 left-0 w-[3px] rounded-r-full ${iconWrapClass[item.type].bar}`} />

      <div
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px]
          ring-1 ring-black/5 transition-transform duration-200
          ${iconWrapClass[item.type].tile}
          ${clickable ? "group-hover:scale-105" : ""}
        `}
      >
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <ITBadget label={meta.label} color={meta.color} size="sm" />
          <span className="text-[10px] font-bold tracking-wide text-secondary-400">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <ITText className={`truncate text-[13px] font-bold leading-tight ${SURFACE.strong}`}>
          {item.title}
        </ITText>
        {item.guardName && (
          <ITText className="mt-0.5 truncate text-[11px] font-medium text-secondary-500 dark:text-secondary-400">
            {item.guardName}
            {item.clientName ? ` · ${item.clientName}` : ""}
          </ITText>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isPanic && item.latitude != null && item.longitude != null && (
          <a
            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`hidden items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ring-1 transition-colors sm:inline-flex ${TONES.danger.soft} ${TONES.danger.text} ${TONES.danger.border} hover:bg-danger-600 hover:text-white`}
          >
            Ubicación
          </a>
        )}

        {clickable && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary-50 transition-colors group-hover:bg-primary-50 dark:bg-secondary-800 dark:group-hover:bg-primary-950/40">
            <FaChevronRight
              size={11}
              className="text-secondary-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary-600"
            />
          </div>
        )}
      </div>
    </div>
  );
};
