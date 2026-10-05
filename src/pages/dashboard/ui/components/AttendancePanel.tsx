import { ITBadget, ITText } from "@axzydev/axzy_ui_system";
import { AttendanceStatus, IAttendanceReport } from "@entities/supervision";
import { SemanticTone, TONES } from "@shared/ui";
import { BOARD } from "./board";

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; badge: "success" | "warning" | "danger" | "gray"; tone: SemanticTone }
> = {
  ABSENT: { label: "Falta", badge: "danger", tone: "danger" },
  LATE: { label: "Retardo", badge: "warning", tone: "warning" },
  PENDING: { label: "Por entrar", badge: "gray", tone: "neutral" },
  ON_TIME: { label: "A tiempo", badge: "success", tone: "success" },
};

const clockOf = (iso: string): string =>
  new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** Faltas y retardos del día: personal operativo contra su horario. */
export const AttendancePanel = ({ report }: { report: IAttendanceReport | null }) => {
  if (!report || report.totals.expected === 0) {
    return (
      <ITText as="p" className={`px-1 py-6 text-center ${BOARD.label}`}>
        Sin turnos programados para hoy.
      </ITText>
    );
  }

  const { totals } = report;
  const summary = [
    { label: "A tiempo", value: totals.onTime, tone: "success" as SemanticTone },
    { label: "Retardo", value: totals.late, tone: "warning" as SemanticTone },
    { label: "Falta", value: totals.absent, tone: "danger" as SemanticTone },
    { label: "Por entrar", value: totals.pending, tone: "neutral" as SemanticTone },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-4 gap-2">
        {summary.map((cell) => {
          const tone = TONES[cell.tone];
          const active = cell.value > 0 && cell.tone !== "neutral";
          return (
            <div key={cell.label} className={`rounded-xl p-2.5 ${active ? tone.soft : "bg-secondary-50 dark:bg-secondary-800/60"}`}>
              <ITText as="p" className={`text-2xl font-black leading-none tabular-nums ${active ? tone.text : "text-secondary-400 dark:text-secondary-500"}`}>
                {cell.value}
              </ITText>
              <ITText as="p" className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-secondary-500 dark:text-secondary-400">
                {cell.label}
              </ITText>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-0.5">
        {report.items.map((item) => {
          const meta = STATUS_META[item.status];
          const prominent = item.status !== "ON_TIME";
          return (
            <div
              key={item.guardId}
              className={`flex items-center gap-3 rounded-xl px-2 py-2 ${prominent ? "" : "opacity-80"}`}
            >
              <span className={`${BOARD.tile} h-8 w-8 ${TONES[meta.tone].soft} ${TONES[meta.tone].softText}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${TONES[meta.tone].dot}`} />
              </span>
              <span className="min-w-0 flex-1">
                <ITText as="span" className={`block truncate text-[13px] font-semibold leading-tight ${BOARD.strong}`}>
                  {item.name} {item.lastName ?? ""}
                </ITText>
                <ITText as="span" className={`block truncate text-[11px] ${BOARD.label}`}>
                  {[item.clientName, item.scheduleName, clockOf(item.scheduledStart)].filter(Boolean).join(" · ")}
                </ITText>
              </span>
              <ITBadget color={meta.badge} size="sm" variant="outlined">
                {meta.label}
              </ITBadget>
              <ITText as="span" className="w-14 shrink-0 text-right text-[11px] font-bold tabular-nums text-secondary-500 dark:text-secondary-400">
                {item.status === "LATE" && item.minutesLate !== null
                  ? `+${item.minutesLate} min`
                  : item.checkInAt
                    ? clockOf(item.checkInAt)
                    : "—"}
              </ITText>
            </div>
          );
        })}
      </div>
    </div>
  );
};
