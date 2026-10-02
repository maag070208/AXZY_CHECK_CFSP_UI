import { ITBadget, ITButton, ITText } from "@axzydev/axzy_ui_system";
import { FaCalendarCheck, FaClipboardCheck, FaTshirt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { IAgendaItem, ILiveDashboard } from "@app/core/types/supervision.types";
import { AGENDA_STATUS_META, complianceColor, formatTime, fullName } from "@app/core/utils/supervision.utils";
import { SURFACE, TONES } from "@shared/ui";

interface CompliancePanelProps {
  compliance: ILiveDashboard["compliance"];
  canRegister: boolean;
}

const TONE_RING: Record<ReturnType<typeof complianceColor>, string> = {
  success: `${TONES.success.soft} ring-success-100`,
  warning: `${TONES.warning.soft} ring-warning-100`,
  danger: `${TONES.danger.soft} ring-danger-100`,
  gray: `${TONES.neutral.soft} ring-secondary-100`,
};

/** Cumplimiento de entregas y uniformes de los turnos en curso + lo pendiente. */
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
      <div className="flex flex-col items-center justify-center px-2 py-8 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-300 ring-1 ring-secondary-100 dark:bg-secondary-800 dark:text-secondary-500 dark:ring-secondary-700">
          <FaCalendarCheck size={22} />
        </span>
        <ITText className="text-sm font-black uppercase tracking-wider text-secondary-700 dark:text-secondary-200">
          Sin turnos programados
        </ITText>
        <ITText className="mx-auto mt-1.5 max-w-[260px] text-xs font-medium leading-relaxed text-secondary-400">
          Programa entregas y revisiones de uniforme para medir su cumplimiento.
        </ITText>
        <ITButton
          variant="outlined"
          color="primary"
          size="sm"
          className="mt-4"
          onClick={() => navigate("/shift-planning")}
        >
          <span className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-wider">
            <FaCalendarCheck size={11} /> Programar turnos
          </span>
        </ITButton>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 grid grid-cols-2 gap-3">
        <RingStat icon={<FaClipboardCheck />} label="Entregas" percent={handover.compliancePercent} done={handover.done} total={handover.total} />
        <RingStat icon={<FaTshirt />} label="Uniformes" percent={uniform.compliancePercent} done={uniform.done} total={uniform.total} />
      </div>

      {pending.length === 0 ? (
        <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 ring-1 ${TONES.success.soft} ring-success-100`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONES.success.dot}`} />
          <ITText className={`text-xs font-bold ${TONES.success.text}`}>Nada pendiente en los turnos en curso</ITText>
        </div>
      ) : (
        <>
          <ITText as="span" className={`${SURFACE.microLabel} mb-2`}>
            Pendientes del turno
          </ITText>
          <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
            {pending.map((i) => {
              const meta = AGENDA_STATUS_META[i.status];
              return (
                <div
                  key={i.id}
                  className="flex items-center gap-2.5 rounded-xl border border-secondary-100 bg-secondary-50 px-3 py-2.5 transition-colors hover:border-secondary-200 hover:bg-white dark:border-secondary-800 dark:bg-secondary-800/50 dark:hover:bg-secondary-800"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] text-secondary-400 ring-1 ring-secondary-100 dark:bg-secondary-900 dark:ring-secondary-700">
                    {i.type === "HANDOVER" ? <FaClipboardCheck /> : <FaTshirt />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <ITText className="truncate text-xs font-bold text-secondary-700 dark:text-secondary-200">
                      {i.type === "HANDOVER" ? `Entrega · ${i.schedule.name}` : fullName(i.guard)}
                    </ITText>
                    <ITText className="truncate text-[11px] font-medium text-secondary-400">
                      {i.client.name} · vence {formatTime(i.dueAt)}
                    </ITText>
                  </div>
                  <ITBadget color={meta.color} size="sm">
                    {meta.label}
                  </ITBadget>
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
  );
};

const RingStat = ({
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
}) => (
  <div className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${TONE_RING[complianceColor(percent)]}`}>
    <ScoreRing percent={percent} size={56} />
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-secondary-400">
        <span className="text-[11px]">{icon}</span>
        <ITText className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-secondary-600 dark:text-secondary-300">
          {label}
        </ITText>
      </div>
      <ITText className="mt-0.5 text-[11px] font-bold tabular-nums text-secondary-500 dark:text-secondary-400">
        {done}/{total} hechas
      </ITText>
    </div>
  </div>
);
