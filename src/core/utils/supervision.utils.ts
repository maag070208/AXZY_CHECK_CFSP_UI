import dayjs from "dayjs";
import {
  AgendaStatus,
  IAgendaSummary,
  IPersonSummary,
} from "@app/core/types/supervision.types";

export const SHIFT_DATE_FORMAT = "YYYY-MM-DD";

/** Etiqueta y color de badge para cada estado de la agenda. */
export const AGENDA_STATUS_META: Record<
  AgendaStatus,
  { label: string; color: "success" | "warning" | "danger" | "gray" | "info" }
> = {
  DONE: { label: "Realizado", color: "success" },
  IN_WINDOW: { label: "En tolerancia", color: "info" },
  OVERDUE: { label: "Vencido", color: "danger" },
  MISSED: { label: "No realizado", color: "gray" },
  UPCOMING: { label: "Programado", color: "warning" },
};

/** 0 = domingo ... 6 = sábado (igual que la API). */
export const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const fullName = (p: IPersonSummary | null | undefined): string =>
  p ? `${p.name} ${p.lastName ?? ""}`.trim() : "—";

export const initials = (p: IPersonSummary | null | undefined): string =>
  fullName(p)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

export const todayShiftDate = (): string => dayjs().format(SHIFT_DATE_FORMAT);

/** "mié 01 oct 2026" */
export const formatShiftDate = (shiftDate: string): string =>
  dayjs(shiftDate).format("ddd DD MMM YYYY");

export const formatTime = (iso: string): string => dayjs(iso).format("HH:mm");

export const formatDateTime = (iso: string): string => dayjs(iso).format("DD MMM YYYY · HH:mm");

/** "hace 5 min", "hace 3 h", "hace 2 d" */
export const timeAgo = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const minutes = Math.max(0, dayjs().diff(dayjs(iso), "minute"));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
};

/** "1 h 20 min" a partir de minutos. */
export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

/** Color semántico para un porcentaje de cumplimiento. */
export const complianceColor = (percent: number | null): "success" | "warning" | "danger" | "gray" => {
  if (percent === null) return "gray";
  if (percent >= 90) return "success";
  if (percent >= 70) return "warning";
  return "danger";
};

export const describeSummary = (s: IAgendaSummary): string => {
  const parts = [`${s.done}/${s.total} realizados`];
  if (s.overdue) parts.push(`${s.overdue} vencidos`);
  if (s.inWindow) parts.push(`${s.inWindow} en tolerancia`);
  return parts.join(" · ");
};
