import { ITBadget, ITButton, ITText } from "@axzydev/axzy_ui_system";
import { FaCalendarCheck, FaClipboardCheck, FaTshirt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { IAgendaItem, ILiveDashboard } from "@app/core/types/supervision.types";
import { AGENDA_STATUS_META, formatTime, fullName } from "@app/core/utils/supervision.utils";

interface CompliancePanelProps {
  compliance: ILiveDashboard["compliance"];
  canRegister: boolean;
}

/** Cumplimiento de entregas y uniformes de los turnos en curso + lo pendiente. */
export const CompliancePanel = ({ compliance, canRegister }: CompliancePanelProps) => {
  const navigate = useNavigate();
  const { handover, uniform, pending } = compliance;
  const nothingPlanned = handover.total === 0 && uniform.total === 0;

  const act = (i: IAgendaItem) =>
    i.type === "HANDOVER"
      ? navigate(`/shift-handovers/new?clientId=${i.client.id}&scheduleId=${i.schedule.id}&shiftDate=${i.shiftDate}`)
      : navigate(`/uniforms?nuevo=1&guardId=${i.guard?.id}&shiftDate=${i.shiftDate}`);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <FaCalendarCheck className="text-slate-400" />
          <ITText className="text-sm font-black text-slate-800">Cumplimiento del turno</ITText>
        </div>
        <ITButton variant="text" color="primary" size="sm" onClick={() => navigate("/shift-planning")}>
          Agenda
        </ITButton>
      </div>

      {nothingPlanned ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <ITText className="text-sm font-bold text-slate-600">Sin turnos programados</ITText>
          <ITText className="text-xs text-slate-400 mt-1 mb-3">Programa entregas y revisiones de uniforme para medir su cumplimiento.</ITText>
          <ITButton variant="outlined" color="primary" size="sm" onClick={() => navigate("/shift-planning")}>
            Programar turnos
          </ITButton>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <RingStat icon={<FaClipboardCheck />} label="Entregas" percent={handover.compliancePercent} done={handover.done} total={handover.total} />
            <RingStat icon={<FaTshirt />} label="Uniformes" percent={uniform.compliancePercent} done={uniform.done} total={uniform.total} />
          </div>
          {pending.length === 0 ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <ITText className="text-xs font-bold text-emerald-700">Nada pendiente en los turnos en curso</ITText>
            </div>
          ) : (
            <div className="space-y-1.5 overflow-y-auto max-h-[260px] pr-1">
              {pending.map((i) => {
                const meta = AGENDA_STATUS_META[i.status];
                return (
                  <div key={i.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50/60">
                    <span className="text-slate-400 text-xs shrink-0">{i.type === "HANDOVER" ? <FaClipboardCheck /> : <FaTshirt />}</span>
                    <div className="flex-1 min-w-0">
                      <ITText className="text-xs font-bold text-slate-700 truncate">
                        {i.type === "HANDOVER" ? `Entrega · ${i.schedule.name}` : fullName(i.guard)}
                      </ITText>
                      <ITText className="text-[11px] text-slate-400 truncate">
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
          )}
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
  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
    <ScoreRing percent={percent} size={52} />
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
        {icon}
        <ITText className="text-xs font-black text-slate-700">{label}</ITText>
      </div>
      <ITText className="text-[11px] text-slate-500 tabular-nums">
        {done}/{total} hechas
      </ITText>
    </div>
  </div>
);
