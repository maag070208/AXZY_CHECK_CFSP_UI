import { ITBadget, ITDialog, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaIdCard, FaTicketAlt, FaUserCheck } from "react-icons/fa";
import { answersToMap, ChecklistGrid } from "@app/core/components/ChecklistGrid";
import { SectionTitle } from "@app/core/components/SectionTitle";
import { IChecklistItemDefinition, IShiftHandoverDetail } from "@app/core/types/supervision.types";
import { formatDateTime, formatShiftDate, fullName } from "@app/core/utils/supervision.utils";
import { getHandoverCatalog, getShiftHandover } from "../services/ShiftHandoversService";

interface ShiftHandoverDetailDialogProps {
  handoverId: string | null;
  onClose: () => void;
}

/** Detalle de una entrega: turno, elementos con puntualidad, caseta y equipo. */
export const ShiftHandoverDetailDialog = ({ handoverId, onClose }: ShiftHandoverDetailDialogProps) => {
  const [detail, setDetail] = useState<IShiftHandoverDetail | null>(null);
  const [catalog, setCatalog] = useState<IChecklistItemDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handoverId) return;
    setDetail(null);
    setError(null);
    Promise.all([getShiftHandover(handoverId), catalog.length ? null : getHandoverCatalog()])
      .then(([res, cat]) => {
        if (res.success) setDetail(res.data);
        else setError(res.messages?.[0] ?? "No se pudo cargar la entrega");
        if (cat?.success) setCatalog(cat.data);
      })
      .catch((err: { messages?: string[] }) => setError(err?.messages?.[0] ?? "No se pudo cargar la entrega"));
  }, [handoverId, catalog.length]);

  return (
    <ITDialog isOpen={!!handoverId} onClose={onClose} title="Detalle de entrega de turno" className="!max-w-3xl w-full!">
      {!detail ? (
        <div className="py-16 flex justify-center">
          {error ? <ITText className="text-sm text-rose-600">{error}</ITText> : <ITLoader size="lg" />}
        </div>
      ) : (
        <div className="space-y-6 max-h-[72vh] overflow-y-auto px-1 pb-2">
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <ITText className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{detail.client.name}</ITText>
              <ITText className="text-lg font-black text-slate-900">
                {detail.schedule.name}{" "}
                <span className="text-slate-400 font-semibold text-sm">
                  {detail.schedule.startTime} - {detail.schedule.endTime}
                </span>
              </ITText>
              <ITText className="text-xs text-slate-500 capitalize">{formatShiftDate(detail.shiftDate)}</ITText>
            </div>
            <div className="flex flex-wrap gap-2">
              <ITBadget color={detail.lateCount ? "danger" : "success"} size="sm">
                {detail.lateCount ? `${detail.lateCount} con retardo` : "Todos puntuales"}
              </ITBadget>
              <ITBadget color={detail.checklistOk === detail.checklistTotal ? "success" : "warning"} size="sm">
                Equipo {detail.checklistOk}/{detail.checklistTotal}
              </ITBadget>
              {detail.reportedToAdmin && (
                <ITBadget color="info" size="sm">
                  Reportado a administración
                </ITBadget>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FaUserCheck className="text-slate-400" />
            <span>
              Registró <span className="font-bold text-slate-800">{fullName(detail.createdBy)}</span> ·{" "}
              {formatDateTime(detail.createdAt)}
            </span>
          </div>

          <section className="space-y-3">
            <SectionTitle>Elementos que recibieron ({detail.elements.length})</SectionTitle>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {detail.elements.map((el) => (
                <div key={el.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                  <div className="min-w-0">
                    <ITText className="text-sm font-bold text-slate-800">{fullName(el.guard)}</ITText>
                    {el.observations && <ITText className="text-xs text-slate-500">{el.observations}</ITText>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ITText className="text-sm font-black tabular-nums text-slate-700">{el.entryTime}</ITText>
                    <ITBadget color={el.punctual ? "success" : "danger"} size="sm">
                      {el.punctual ? "A tiempo" : "Retardo"}
                    </ITBadget>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Caseta</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <Metric icon={<FaIdCard />} label="Credenciales" value={detail.credentialsCount} />
              <Metric icon={<FaTicketAlt />} label="Tarjetones" value={detail.tarjetonesCount} />
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <ITText className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">Novedades</ITText>
              <ITText className="text-sm text-slate-700 whitespace-pre-line">{detail.novedades || "Sin novedades registradas."}</ITText>
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle aside={<FaCheckCircle className="text-slate-300" />}>Verificación de equipo</SectionTitle>
            {catalog.length ? (
              <ChecklistGrid catalog={catalog} values={answersToMap(detail.checklist)} />
            ) : (
              <ITLoader size="md" />
            )}
          </section>
        </div>
      )}
    </ITDialog>
  );
};

const Metric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
    <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">{icon}</span>
    <div>
      <ITText className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</ITText>
      <ITText className="text-lg font-black text-slate-800 tabular-nums">{value ?? "—"}</ITText>
    </div>
  </div>
);
