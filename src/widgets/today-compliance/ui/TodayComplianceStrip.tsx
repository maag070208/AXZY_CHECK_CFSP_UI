import { ITButton, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCalendarCheck, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { AgendaItemType, IAgendaSummary } from "@app/core/types/supervision.types";
import { getCurrentAgenda } from "../services/ShiftPlansService";

interface TodayComplianceStripProps {
  type: AgendaItemType;
  /** Cambia para volver a consultar (p. ej. tras registrar algo). */
  reloadKey?: number;
}

const LABEL: Record<AgendaItemType, { title: string; unit: string }> = {
  HANDOVER: { title: "Entregas de los turnos de hoy y en curso", unit: "entregas" },
  UNIFORM: { title: "Uniformes de los turnos de hoy y en curso", unit: "revisiones" },
};

/**
 * Resumen de los turnos vigentes (hoy y nocturnos de ayer en curso) según la programación: cuántos compromisos van, cuántos
 * están vencidos y acceso directo a la agenda. No se muestra si no hay nada
 * programado para hoy.
 */
export const TodayComplianceStrip = ({ type, reloadKey = 0 }: TodayComplianceStripProps) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<IAgendaSummary | null>(null);

  useEffect(() => {
    getCurrentAgenda()
      .then((res) => {
        if (res.success) setSummary(type === "HANDOVER" ? res.data.handoverSummary : res.data.uniformSummary);
      })
      .catch(() => setSummary(null));
  }, [type, reloadKey]);

  if (!summary || summary.total === 0) return null;
  const { title, unit } = LABEL[type];
  const pending = summary.overdue + summary.inWindow;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4 flex-1">
        <ScoreRing percent={summary.compliancePercent} size={56} />
        <div>
          <ITText className="text-sm font-black text-slate-800">{title}</ITText>
          <ITText className="text-xs text-slate-500">
            {summary.done} de {summary.total} {unit} realizadas
            {summary.upcoming > 0 && ` · ${summary.upcoming} por iniciar`}
          </ITText>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {summary.overdue > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold">{summary.overdue} vencidas</span>
        )}
        {summary.inWindow > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold">
            {summary.inWindow} en tolerancia
          </span>
        )}
        {summary.missed > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
            {summary.missed} no realizadas
          </span>
        )}
        <ITButton variant="outlined" color={pending > 0 ? "danger" : "secondary"} size="sm" onClick={() => navigate("/shift-planning")}>
          <span className="flex items-center gap-1.5">
            <FaCalendarCheck size={11} /> Ver agenda <FaChevronRight size={9} />
          </span>
        </ITButton>
      </div>
    </div>
  );
};
