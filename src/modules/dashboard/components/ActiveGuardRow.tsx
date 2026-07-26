import { ITBadget, ITText } from "@axzydev/axzy_ui_system";
import { ReactNode } from "react";
import { IActiveGuard, OperationalRole } from "../services/DashboardService";
import { FaMapPin, FaRoute, FaUserTie, FaUserShield, FaTools } from "react-icons/fa";

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
    avatar: string;
    badgeColor: "primary" | "warning" | "info";
    icon: ReactNode;
  }
> = {
  GUARD: {
    label: "Guardia",
    short: "G",
    avatar: "from-emerald-500 to-emerald-700",
    badgeColor: "primary",
    icon: <FaUserShield size={10} />,
  },
  SHIFT: {
    label: "Jefe de Turno",
    short: "JT",
    avatar: "from-violet-500 to-violet-700",
    badgeColor: "warning",
    icon: <FaUserTie size={10} />,
  },
  MAINT: {
    label: "Mantenimiento",
    short: "M",
    avatar: "from-sky-500 to-sky-700",
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
        group flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-200
        ${
          onDuty
            ? "bg-white border-slate-200/70 hover:border-emerald-200 hover:shadow-[0_4px_14px_rgba(16,185,129,0.08)]"
            : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
        }
      `}
    >
      <div className="relative shrink-0">
        <div
          className={`
            w-11 h-11 rounded-full bg-gradient-to-br ${role.avatar}
            flex items-center justify-center font-black text-white text-sm
            shadow-sm ring-2 ring-white
          `}
        >
          {initials(guard.name, guard.lastName) || role.short}
        </div>
        <span
          className={`
            absolute -bottom-0.5 -right-0.5
            w-3.5 h-3.5 rounded-full ring-2 ring-white
            ${onDuty ? "bg-emerald-500" : "bg-slate-400"}
          `}
        >
          {onDuty && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
          )}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <ITText className="text-sm font-bold text-slate-900 truncate">
            {guard.name} {guard.lastName}
          </ITText>
          <ITBadget
            label={role.label}
            color={role.badgeColor}
            size="small"
          />
          <ITBadget
            label={onDuty ? "EN TURNO" : "FUERA"}
            color={onDuty ? "success" : "secondary"}
            size="small"
          />
        </div>
        <ITText className="text-xs text-slate-500 font-medium truncate mt-0.5">
          {guard.clientName ?? "Sin cliente"}
        </ITText>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-semibold">
          {guard.currentRoundId && (
            <span className="flex items-center gap-1 text-emerald-700">
              <FaRoute />
              En ronda
            </span>
          )}
          {guard.lastKardexAt && (
            <span className="flex items-center gap-1 text-sky-700">
              <FaMapPin />
              {guard.lastKardexLocation ?? "Último escaneo"}{" "}
              <span className="text-slate-500 font-medium">
                · {formatRelativeTime(guard.lastKardexAt)}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
