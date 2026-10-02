import { ITBadget, ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { IActiveGuard, OperationalRole } from "../services/DashboardService";
import { FaMapPin, FaRoute, FaUserTie, FaUserShield, FaTools } from "react-icons/fa";
import { SemanticTone, TONES } from "@shared/ui";

const formatRelativeTime = (iso: string | null): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
};

interface ActiveGuardRowProps {
  guard: IActiveGuard;
}

const initials = (name: string, lastName?: string) => {
  const n = name?.charAt(0).toUpperCase() ?? "";
  const l = lastName?.charAt(0).toUpperCase() ?? "";
  return `${n}${l}`;
};

const roleMeta: Record<
  OperationalRole,
  {
    label: string;
    short: string;
    tone: SemanticTone;
    avatar: string;
    badgeColor: "primary" | "warning" | "info";
    icon: ReactNode;
  }
> = {
  GUARD: {
    label: "Guardia",
    short: "G",
    tone: "brand",
    avatar: "bg-primary-500",
    badgeColor: "primary",
    icon: <FaUserShield size={10} />,
  },
  SHIFT: {
    label: "Jefe de Turno",
    short: "JT",
    tone: "accent",
    avatar: "bg-purple-500",
    badgeColor: "warning",
    icon: <FaUserTie size={10} />,
  },
  MAINT: {
    label: "Mantenimiento",
    short: "M",
    tone: "info",
    avatar: "bg-info-500",
    badgeColor: "info",
    icon: <FaTools size={10} />,
  },
};

export const ActiveGuardRow = ({ guard }: ActiveGuardRowProps) => {
  const onDuty = guard.isLoggedIn;
  const role = roleMeta[guard.role] ?? roleMeta.GUARD;

  return (
    <div
      className={`
        group relative flex items-center gap-3.5 overflow-hidden rounded-xl border p-3.5 pl-4
        transition-all duration-200
        ${
          onDuty
            ? "border-secondary-200 bg-white hover:border-primary-200 hover:shadow-[0_10px_24px_-14px_rgba(16,185,129,0.35)] dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-primary-800"
            : "border-secondary-100 bg-secondary-50 hover:border-secondary-200 dark:border-secondary-800 dark:bg-secondary-900/50"
        }
      `}
    >
      <span className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${onDuty ? TONES.brand.bar : TONES.neutral.bar}`} />

      <div className="relative shrink-0">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black text-white shadow-sm ring-2 ring-white dark:ring-secondary-900 ${role.avatar}`}
        >
          {initials(guard.name, guard.lastName) || role.short}
        </div>
        <span
          className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-secondary-900 ${
            onDuty ? "bg-primary-500" : "bg-secondary-400"
          }`}
        >
          {onDuty && <span className="absolute inset-0 animate-ping rounded-full bg-primary-400 opacity-75" />}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ITText className="min-w-0 flex-1 truncate text-[13px] font-bold leading-tight text-secondary-900 dark:text-secondary-50">
            {guard.name} {guard.lastName}
          </ITText>
          <span className="shrink-0">
            <ITBadget label={onDuty ? "EN TURNO" : "FUERA"} color={onDuty ? "success" : "secondary"} size="sm" />
          </span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="shrink-0 text-secondary-400">{role.icon}</span>
          <ITText as="span" className="shrink-0 text-[10px] font-black uppercase tracking-[0.1em] text-secondary-400">
            {role.label}
          </ITText>
          <span className="text-secondary-300 dark:text-secondary-600">·</span>
          <ITText as="span" className="truncate text-[11px] font-medium text-secondary-500 dark:text-secondary-400">
            {guard.clientName ?? "Sin cliente"}
          </ITText>
        </div>

        {(guard.currentRoundId || guard.lastKardexAt) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold">
            {guard.currentRoundId && (
              <span className={`inline-flex items-center gap-1.5 ${TONES.brand.text}`}>
                <FaRoute size={9} />
                En ronda
              </span>
            )}
            {guard.lastKardexAt && (
              <span className={`inline-flex min-w-0 items-center gap-1.5 ${TONES.info.text}`}>
                <FaMapPin size={9} className="shrink-0" />
                <span className="truncate">{guard.lastKardexLocation ?? "Último escaneo"}</span>
                <span className="shrink-0 font-medium text-secondary-500 dark:text-secondary-400">
                  · {formatRelativeTime(guard.lastKardexAt)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
