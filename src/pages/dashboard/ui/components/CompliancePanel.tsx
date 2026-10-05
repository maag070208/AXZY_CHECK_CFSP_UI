import { ITButton, ITText } from "@axzydev/axzy_ui_system";
import { FaCalendarCheck, FaClipboardCheck, FaTshirt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { IAgendaItem, ILiveDashboard } from "@entities/supervision";
import { AGENDA_STATUS_META, complianceColor, formatTime, fullName } from "@app/core/utils/supervision.utils";
import { TONES } from "@shared/ui";
import { BOARD } from "./board";

interface CompliancePanelProps {
  compliance: ILiveDashboard["compliance"];
  canRegister: boolean;
}

const BAR_TONE: Record<ReturnType<typeof complianceColor>, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  gray: "bg-secondary-400",
};

const TEXT_TONE: Record<ReturnType<typeof complianceColor>, string> = {
  success: TONES.success.text,
  warning: TONES.warning.text,
  danger: TONES.danger.text,
  gray: "text-secondary-500 dark:text-secondary-400",
};

/** Cumplimiento de entregas y uniformes del turno + lo que queda pendiente. */
export const CompliancePanel = ({ compliance, canRegister }: CompliancePanelProps) => {
  const navigate = useNavigate();
  const { handover, uniform, pending } = compliance;
  const nothingPlanned = handover.total === 0 && uniform.total === 0;

  const act = (i: IAgendaItem) =>
    i.type === "HANDOVER"
      ? navigate(`/shift-handovers/new?clientId=${i.client.id}&scheduleId=${i.schedule.id}&shiftDate=${i.shiftDate}`)
      : navigate(`/uniforms?nuevo=1&guardId=${i.guard?.id}&shiftDate=${i.shiftDate}`);

  if (nothingPlanned) {
    return (
      <div className="flex flex-col items-start gap-3 px-1 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100 text-secondary-400 dark:bg-secondary-800 dark:text-secondary-500">
          <FaCalendarCheck aria-hidden="true" />
        </span>
        <div>
          <ITText as="p" className={`text-[13px] font-semibold ${BOARD.strong}`}>
            Sin turnos programados
          </ITText>
          <ITText as="p" className={`mt-0.5 max-w-[260px] ${BOARD.label}`}>
            Programa entregas y revisiones de uniforme para medir su cumplimiento.
          </ITText>
        </div>
        <ITButton variant="outlined" color="primary" size="sm" onClick={() => navigate("/shift-planning")}>
          Programar turnos
        </ITButton>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-2 divide-x divide-secondary-100 dark:divide-secondary-800">
        <Gauge label="Entregas" icon={<FaClipboardCheck aria-hidden="true" size={11} />} percent={handover.compliancePercent} done={handover.done} total={handover.total} />
        <Gauge label="Uniformes" icon={<FaTshirt aria-hidden="true" size={11} />} percent={uniform.compliancePercent} done={uniform.done} total={uniform.total} />
      </div>

      <div className="mt-3 border-t border-secondary-100 pt-3 dark:border-secondary-800">
        {pending.length === 0 ? (
          <ITText as="p" className={`flex items-center gap-2 ${BOARD.label}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
            Nada pendiente en los turnos en curso
          </ITText>
        ) : (
          <>
            <ITText as="p" className={`mb-1 ${BOARD.label}`}>
              Pendientes del turno
            </ITText>
            <div className={`max-h-[260px] overflow-y-auto pr-1 ${BOARD.divide}`}>
              {pending.map((i) => {
                const meta = AGENDA_STATUS_META[i.status];
                return (
                  <div key={i.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-secondary-100 text-[11px] text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400">
                      {i.type === "HANDOVER" ? <FaClipboardCheck aria-hidden="true" /> : <FaTshirt aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <ITText as="p" className={`truncate text-[12px] font-semibold ${BOARD.strong}`}>
                        {i.type === "HANDOVER" ? `Entrega · ${i.schedule.name}` : fullName(i.guard)}
                      </ITText>
                      <ITText as="p" className={`truncate ${BOARD.label}`}>
                        {i.client.name} · vence {formatTime(i.dueAt)}
                      </ITText>
                    </div>
                    <ITText as="span" className={`shrink-0 text-[11px] font-semibold ${meta.color === "danger" ? TONES.danger.text : meta.color === "success" ? TONES.success.text : "text-secondary-500 dark:text-secondary-400"}`}>
                      {meta.label}
                    </ITText>
                    {canRegister && (
                      <ITButton variant="text" color="primary" size="sm" onClick={() => act(i)}>
                        {i.type === "HANDOVER" ? "Registrar" : "Revisar"}
                      </ITButton>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Gauge = ({
  icon,
  label,
  percent,
  done,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  percent: number | null;
  done: number;
  total: number;
}) => {
  const tone = complianceColor(percent);
  return (
    <div className="px-3 py-2 first:pl-0 last:pr-0">
      <span className={`flex items-center gap-1.5 ${BOARD.label}`}>
        {icon}
        {label}
      </span>
      <ITText as="p" className={`mt-1 text-[24px] leading-none ${BOARD.num} ${TEXT_TONE[tone]}`}>
        {percent === null ? "—" : `${percent}%`}
      </ITText>
      <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
        <span className={`block h-full rounded-full ${BAR_TONE[tone]}`} style={{ width: `${percent ?? 0}%` }} />
      </span>
      <ITText as="p" className={`mt-1.5 tabular-nums ${BOARD.label}`}>
        {done}/{total} hechas
      </ITText>
    </div>
  );
};
