import {
  ITButton,
  ITDialog,
  ITLoader,
  ITSearchSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { ChecklistGrid } from "@app/core/components/ChecklistGrid";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { useUniformCheckFormDialog, type UniformCheckFormDialogProps } from "../model/useUniformCheckFormDialog";
import { SectionTitle } from "@app/core/components/SectionTitle";


export const UniformCheckFormDialog = ({
  isOpen,
  onClose,
  onSaved,
  initialGuardId,
  shiftDate,
}: UniformCheckFormDialogProps) => {
  const {
    loadingGuards,
    catalog,
    total,
    okCount,
    selectedGuard,
    guardClient,
    compliant,
    score,
    clientId,
    setClientId,
    clientOptions,
    guardId,
    setGuardId,
    guardOptions,
    notes,
    setNotes,
    saving,
    values,
    setValues,
    handleSave,
  } = useUniformCheckFormDialog({ isOpen, onClose, onSaved, initialGuardId, shiftDate });
  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Nueva revisión de uniforme" className="!max-w-3xl w-full!">
      <div className="flex flex-col bg-white overflow-hidden">
        <div className="px-1 py-2 space-y-8 max-h-[68vh] overflow-y-auto">
          <section className="space-y-4">
            <SectionTitle>Elemento a revisar</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ITSearchSelect
                label="Cliente"
                placeholder="Todos los clientes"
                options={clientOptions}
                value={clientId}
                clearable
                onClear={() => setClientId("")}
                onChange={(v) => {
                  setClientId(String(v));
                  setGuardId("");
                }}
              />
              <ITSearchSelect
                label="Guardia"
                placeholder={loadingGuards ? "Cargando guardias..." : "Selecciona un guardia"}
                options={guardOptions}
                value={guardId}
                required
                onChange={(v) => setGuardId(String(v))}
                noResultsMessage="Sin guardias para este cliente"
              />
            </div>
            {selectedGuard && (
              <ITText className="text-xs text-slate-500">
                Asignado a <span className="font-bold text-slate-700">{guardClient?.name ?? "sin cliente"}</span>
                {shiftDate ? ` · turno del ${shiftDate}` : " · se registra en su turno en curso"}
              </ITText>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <SectionTitle>Checklist</SectionTitle>
                <ITText className="text-xs text-slate-500 mt-1">
                  Todo inicia como cumple: marca solo lo que falta o está mal.
                </ITText>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <ITText className={`text-xs font-black uppercase tracking-wider ${compliant ? "text-emerald-600" : "text-rose-600"}`}>
                    {compliant ? "Cumple" : "No cumple"}
                  </ITText>
                  <ITText className="text-[11px] text-slate-400 tabular-nums">
                    {okCount}/{total} puntos
                  </ITText>
                </div>
                <ScoreRing percent={catalog ? score : null} size={60} tone={catalog && !compliant ? "danger" : undefined} />
              </div>
            </div>
            {catalog ? (
              <ChecklistGrid
                catalog={catalog.items}
                values={values}
                onToggle={(key, ok) => setValues((prev) => ({ ...prev, [key]: ok }))}
              />
            ) : (
              <div className="py-10 flex justify-center">
                <ITLoader size="md" />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>Observaciones</SectionTitle>
            <ITTextarea
              name="notes"
              value={notes}
              onChange={setNotes}
              placeholder="Detalles de lo que no cumple, acuerdos, etc."
              rows={3}
              maxLength={1000}
            />
          </section>
        </div>

        <div className="flex justify-end items-center pt-5 mt-2 border-t border-slate-100 gap-3">
          <ITButton variant="filled" color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </ITButton>
          <ITButton color="primary" onClick={handleSave} disabled={saving || !guardId || !catalog}>
            {saving ? <ITLoader size="sm" /> : "Guardar revisión"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
