import { ITText } from "@axzydev/axzy_ui_system";
import { IActiveGuard, OperationalRole } from "@entities/supervision";
import { FaMapPin, FaRoute } from "react-icons/fa";
import { TONES } from "@shared/ui";
import { BOARD } from "./board";

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

const initials = (name: string, lastName?: string) => {
  const n = name?.charAt(0).toUpperCase() ?? "";
  const l = lastName?.charAt(0).toUpperCase() ?? "";
  return `${n}${l}`;
};

const roleMeta: Record<OperationalRole, { label: string; avatar: string }> = {
  GUARD: { label: "Guardia", avatar: "bg-primary-500" },
  SHIFT: { label: "Jefe de turno", avatar: "bg-purple-500" },
  MAINT: { label: "Mantenimiento", avatar: "bg-info-500" },
};

interface ActiveGuardRowProps {
  guard: IActiveGuard;
}

/**
 * Fila del personal en turno. Es una línea, no una tarjeta: el estado en
 * servicio se marca con el borde izquierdo y un punto, sin badge.
 */
export const ActiveGuardRow = ({ guard }: ActiveGuardRowProps) => {
  const onDuty = guard.isLoggedIn;
  const role = roleMeta[guard.role] ?? roleMeta.GUARD;

  return (
    <div
      className={`flex items-center gap-3 border-l-2 py-3 pl-3 pr-1 ${onDuty ? "border-l-success-500" : "border-l-secondary-200 dark:border-l-secondary-700"}`}
    >
      <div className="relative shrink-0">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white ${role.avatar}`}>
          {initials(guard.name, guard.lastName)}
        </div>
        <span
          aria-hidden="true"
          className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-secondary-900 ${
            onDuty ? "bg-success-500" : "bg-secondary-300 dark:bg-secondary-600"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ITText as="span" className={`min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight ${BOARD.strong}`}>
            {guard.name} {guard.lastName}
          </ITText>
          <ITText as="span" className={`shrink-0 text-[11px] font-semibold ${onDuty ? TONES.success.text : BOARD.label}`}>
            {onDuty ? "En turno" : "Fuera"}
          </ITText>
        </div>

        <ITText as="span" className={`mt-0.5 block truncate ${BOARD.label}`}>
          {role.label}
          {guard.clientName ? <span className="text-secondary-400 dark:text-secondary-500"> · {guard.clientName}</span> : null}
        </ITText>

        {(guard.currentRoundId || guard.lastKardexAt) && (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium">
            {guard.currentRoundId && (
              <span className={`inline-flex items-center gap-1.5 ${TONES.brand.text}`}>
                <FaRoute aria-hidden="true" size={9} />
                En ronda
              </span>
            )}
            {guard.lastKardexAt && (
              <span className={`inline-flex min-w-0 items-center gap-1.5 ${TONES.info.text}`}>
                <FaMapPin aria-hidden="true" size={9} className="shrink-0" />
                <span className="truncate">{guard.lastKardexLocation ?? "Último escaneo"}</span>
                <span className="shrink-0 text-secondary-400 dark:text-secondary-500">· {formatRelativeTime(guard.lastKardexAt)}</span>
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
};
