import { ITText } from "@axzydev/axzy_ui_system";
import { useNavigate } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import { IActivityItem } from "@entities/supervision";
import { activityItemToHref } from "./activityNavigation";
import { TONES } from "@shared/ui";
import { BOARD } from "./board";

type ActivityType = IActivityItem["type"];

const TYPE_META: Record<ActivityType, { label: string; rail: string; tint: string }> = {
  panic: { label: "Pánico", rail: "border-l-danger-500", tint: TONES.danger.soft },
  incident: { label: "Incidencia", rail: "border-l-warning-500", tint: "" },
  maintenance: { label: "Mantenimiento", rail: "border-l-info-500", tint: "" },
  discipline: { label: "Disciplina", rail: "border-l-purple-500", tint: "" },
  round: { label: "Ronda", rail: "border-l-primary-500", tint: "" },
  kardex: { label: "Kardex", rail: "border-l-secondary-300 dark:border-l-secondary-700", tint: "" },
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
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
};

/** Fila del feed de actividad. Línea reglada, mismo lenguaje que las alertas. */
export const ActivityItemRow = ({ item }: ActivityItemRowProps) => {
  const navigate = useNavigate();
  const meta = TYPE_META[item.type];
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

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      aria-label={clickable ? `Ver detalle de ${meta.label}` : undefined}
      className={`group flex items-center gap-3 border-l-2 py-3 pl-3 pr-1 transition-colors ${meta.rail} ${meta.tint} ${
        clickable ? "cursor-pointer hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400 dark:hover:bg-secondary-800/50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <ITText as="span" className={`block truncate text-[13px] font-semibold leading-tight ${BOARD.strong}`}>
          {item.title}
        </ITText>
        {(item.guardName || item.clientName) && (
          <ITText as="span" className={`block truncate ${BOARD.label}`}>
            {[item.guardName, item.clientName].filter(Boolean).join(" · ")}
          </ITText>
        )}
      </div>

      <ITText as="span" className="hidden shrink-0 text-[11px] font-medium text-secondary-400 sm:block dark:text-secondary-500">
        {meta.label}
      </ITText>

      <ITText as="span" className="shrink-0 text-[11px] font-medium tabular-nums text-secondary-400 dark:text-secondary-500">
        {formatRelativeTime(item.createdAt)}
      </ITText>

      {item.type === "panic" && item.latitude != null && item.longitude != null && (
        <a
          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`hidden shrink-0 items-center px-2 py-1 text-[11px] font-semibold underline underline-offset-4 sm:inline-flex ${TONES.danger.text}`}
        >
          Ubicación
        </a>
      )}

      {clickable && (
        <FaChevronRight
          aria-hidden="true"
          size={11}
          className="shrink-0 text-secondary-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-secondary-500"
        />
      )}
    </div>
  );
};
