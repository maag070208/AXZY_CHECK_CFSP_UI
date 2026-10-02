import { ITBadget, ITDialog, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaUserCheck } from "react-icons/fa";
import { answersToMap, ChecklistGrid } from "@app/core/components/ChecklistGrid";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { SectionTitle } from "@app/core/components/SectionTitle";
import { IUniformCatalog, IUniformCheck } from "@app/core/types/supervision.types";
import { formatDateTime, formatShiftDate, fullName, initials } from "@app/core/utils/supervision.utils";
import { getUniformCatalog } from "../services/UniformChecksService";

interface UniformCheckDetailDialogProps {
  check: IUniformCheck | null;
  onClose: () => void;
}

/** Detalle de una revisión: puntaje, quién evaluó y el checklist completo. */
export const UniformCheckDetailDialog = ({ check, onClose }: UniformCheckDetailDialogProps) => {
  const [catalog, setCatalog] = useState<IUniformCatalog | null>(null);

  useEffect(() => {
    if (!check || catalog) return;
    getUniformCatalog()
      .then((res) => res.success && setCatalog(res.data))
      .catch(() => setCatalog(null));
  }, [check, catalog]);

  if (!check) return null;
  const okCount = check.items.filter((i) => i.ok).length;
  const failed = catalog?.items.filter((i) => !answersToMap(check.items)[i.key]) ?? [];

  return (
    <ITDialog isOpen={!!check} onClose={onClose} title="Detalle de revisión de uniforme" className="!max-w-2xl w-full!">
      <div className="space-y-6 max-h-[72vh] overflow-y-auto px-1 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-black">
              {initials(check.guard)}
            </div>
            <div className="min-w-0">
              <ITText className="text-lg font-black text-slate-900 truncate">{fullName(check.guard)}</ITText>
              <ITText className="text-xs text-slate-500">
                Turno del {formatShiftDate(check.shiftDate)}
                {check.schedule ? ` · ${check.schedule.name}` : ""}
              </ITText>
              {check.client && <ITText className="text-xs font-semibold text-slate-600">{check.client.name}</ITText>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <ITBadget color={check.compliant ? "success" : "danger"} size="sm">
                {check.compliant ? "CUMPLE" : "NO CUMPLE"}
              </ITBadget>
              <ITText className="text-[11px] text-slate-400 mt-1 tabular-nums">
                {okCount}/{check.items.length} puntos
              </ITText>
            </div>
            <ScoreRing percent={check.score} size={68} tone={check.compliant ? undefined : "danger"} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FaUserCheck className="text-slate-400" />
          <span>
            Evaluó <span className="font-bold text-slate-800">{fullName(check.evaluatedBy)}</span> ·{" "}
            {formatDateTime(check.createdAt)}
          </span>
        </div>

        {failed.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
            <ITText className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500 mb-1">Faltantes</ITText>
            <ITText className="text-sm font-semibold text-rose-800">{failed.map((f) => f.label).join(", ")}</ITText>
          </div>
        )}

        <section className="space-y-3">
          <SectionTitle>Checklist</SectionTitle>
          {catalog ? (
            <ChecklistGrid catalog={catalog.items} values={answersToMap(check.items)} />
          ) : (
            <div className="py-8 flex justify-center">
              <ITLoader size="md" />
            </div>
          )}
        </section>

        {check.notes && (
          <section className="space-y-2">
            <SectionTitle>Observaciones</SectionTitle>
            <ITText className="text-sm text-slate-700 whitespace-pre-line">{check.notes}</ITText>
          </section>
        )}
      </div>
    </ITDialog>
  );
};
