import {
  ITButton,
  ITDialog,
  ITLoader,
  ITSearchSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ChecklistGrid, mapToAnswers } from "@app/core/components/ChecklistGrid";
import { ScoreRing } from "@app/core/components/ScoreRing";
import { SectionTitle } from "@app/core/components/SectionTitle";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ICatalogItem } from "@app/core/types/catalog.types";
import { IUniformCatalog, IUniformCheck } from "@app/core/types/supervision.types";
import { createUniformCheck, getUniformCatalog } from "../services/UniformChecksService";

type GuardOption = ICatalogItem & { clientId?: string | null };

interface UniformCheckFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (check: IUniformCheck) => void;
  /** Precarga desde la agenda. */
  initialGuardId?: string;
  shiftDate?: string;
}

let catalogCache: IUniformCatalog | null = null;

export const UniformCheckFormDialog = ({
  isOpen,
  onClose,
  onSaved,
  initialGuardId,
  shiftDate,
}: UniformCheckFormDialogProps) => {
  const dispatch = useDispatch();
  const { data: clients } = useCatalog("client");
  const { data: guardsRaw, loading: loadingGuards } = useCatalog("guard");
  const guards = guardsRaw as GuardOption[];

  const [catalog, setCatalog] = useState<IUniformCatalog | null>(catalogCache);
  const [clientId, setClientId] = useState("");
  const [guardId, setGuardId] = useState(initialGuardId ?? "");
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setGuardId(initialGuardId ?? "");
    setNotes("");
    if (catalogCache) {
      setValues(Object.fromEntries(catalogCache.items.map((i) => [i.key, true])));
      return;
    }
    getUniformCatalog()
      .then((res) => {
        if (!res.success) return;
        catalogCache = res.data;
        setCatalog(res.data);
        setValues(Object.fromEntries(res.data.items.map((i) => [i.key, true])));
      })
      .catch(() => dispatch(showToast({ message: "No se pudo cargar el catálogo de uniforme", type: "error" })));
  }, [isOpen, initialGuardId, dispatch]);

  const guardOptions = useMemo(
    () =>
      guards
        .filter((g) => !clientId || g.clientId === clientId)
        .map((g) => ({ label: g.value, value: String(g.id) })),
    [guards, clientId],
  );
  const clientOptions = useMemo(() => clients.map((c) => ({ label: c.name, value: String(c.id) })), [clients]);
  const selectedGuard = guards.find((g) => String(g.id) === guardId);
  const guardClient = clients.find((c) => String(c.id) === selectedGuard?.clientId);

  const total = catalog?.items.length ?? 0;
  const okCount = catalog?.items.filter((i) => values[i.key]).length ?? 0;
  const score = total ? Math.round((okCount / total) * 100) : 0;
  const compliant = catalog ? score >= catalog.minCompliantScore : false;

  const handleSave = async () => {
    if (!catalog || !guardId) return;
    setSaving(true);
    try {
      const res = await createUniformCheck({
        guardId,
        shiftDate,
        items: mapToAnswers(catalog.items, values),
        notes: notes.trim() || null,
      });
      if (res.success) {
        dispatch(showToast({ message: "Revisión de uniforme registrada", type: "success" }));
        onSaved(res.data);
      } else {
        dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo guardar", type: "error" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] ?? "No se pudo guardar la revisión", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

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
