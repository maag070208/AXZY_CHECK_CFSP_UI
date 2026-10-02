import {
  ITButton,
  ITDialog,
  ITInputNumber,
  ITLoader,
  ITSearchSelect,
  ITSelect,
  ITSlideToggle,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { SectionTitle } from "@app/core/components/SectionTitle";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { IShiftPlan } from "@app/core/types/supervision.types";
import { WEEKDAY_SHORT } from "@app/core/utils/supervision.utils";
import { getSchedules, Schedule } from "@modules/schedules/SchedulesService";
import { createShiftPlan, updateShiftPlan } from "../services/ShiftPlansService";

interface ShiftPlanFormDialogProps {
  isOpen: boolean;
  /** Plan a editar; null para crear. */
  plan: IShiftPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_TOLERANCE = 30;

export const ShiftPlanFormDialog = ({ isOpen, plan, onClose, onSaved }: ShiftPlanFormDialogProps) => {
  const dispatch = useDispatch();
  const { data: clients } = useCatalog("client");
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [clientId, setClientId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [requireHandover, setRequireHandover] = useState(true);
  const [requireUniform, setRequireUniform] = useState(true);
  const [tolerance, setTolerance] = useState<number | undefined>(DEFAULT_TOLERANCE);
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setClientId(plan?.clientId ?? "");
    setScheduleId(plan?.scheduleId ?? "");
    setRequireHandover(plan?.requireHandover ?? true);
    setRequireUniform(plan?.requireUniform ?? true);
    setTolerance(plan?.toleranceMinutes ?? DEFAULT_TOLERANCE);
    setDays(plan?.daysOfWeek ?? ALL_DAYS);
    setActive(plan?.active ?? true);
    if (!schedules.length) {
      getSchedules()
        .then((list) => setSchedules(list.filter((s) => s.active)))
        .catch(() => setSchedules([]));
    }
  }, [isOpen, plan, schedules.length]);

  const toggleDay = (day: number) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)));

  const isValid =
    (!!plan || (!!clientId && !!scheduleId)) &&
    (requireHandover || requireUniform) &&
    days.length > 0 &&
    tolerance !== undefined &&
    tolerance >= 0 &&
    tolerance <= 240;

  const handleSave = async () => {
    if (!isValid || tolerance === undefined) return;
    setSaving(true);
    try {
      const body = { requireHandover, requireUniform, toleranceMinutes: tolerance, daysOfWeek: days, active };
      const res = plan ? await updateShiftPlan(plan.id, body) : await createShiftPlan({ ...body, clientId, scheduleId });
      if (res.success) {
        dispatch(showToast({ message: plan ? "Programación actualizada" : "Turno programado", type: "success" }));
        onSaved();
      } else {
        dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo guardar", type: "error" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] ?? "No se pudo guardar la programación", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={plan ? "Editar programación" : "Programar turno"} className="!max-w-2xl w-full!">
      <div className="flex flex-col bg-white">
        <div className="space-y-8 px-1 py-2">
          <section className="space-y-4">
            <SectionTitle>Turno</SectionTitle>
            {plan ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <ITText className="text-sm font-black text-slate-800">{plan.client.name}</ITText>
                <ITText className="text-xs text-slate-500">
                  {plan.schedule.name} · {plan.schedule.startTime} - {plan.schedule.endTime}
                </ITText>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ITSearchSelect
                  label="Cliente"
                  required
                  placeholder="Selecciona el cliente"
                  options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
                  value={clientId}
                  onChange={(v) => setClientId(String(v))}
                />
                <ITSelect
                  name="scheduleId"
                  label="Horario"
                  required
                  placeholder="Selecciona el horario"
                  options={schedules.map((s) => ({ label: `${s.name} (${s.startTime} - ${s.endTime})`, value: s.id }))}
                  value={scheduleId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScheduleId(e.target.value)}
                />
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle>Qué se exige al iniciar el turno</SectionTitle>
            <ToggleRow
              title="Entrega de turno"
              description="Registro de quién recibe, hora de entrada y estado del equipo."
              isOn={requireHandover}
              onToggle={setRequireHandover}
            />
            <ToggleRow
              title="Revisión de uniforme"
              description="Una revisión por cada guardia asignado a este horario y cliente."
              isOn={requireUniform}
              onToggle={setRequireUniform}
            />
            {!requireHandover && !requireUniform && (
              <ITText className="text-xs font-semibold text-rose-600">Activa al menos una exigencia.</ITText>
            )}
          </section>

          <section className="space-y-4">
            <SectionTitle>Reglas</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start">
              <ITInputNumber
                name="tolerance"
                label="Tolerancia (minutos)"
                min={0}
                max={240}
                value={tolerance ?? null}
                onChange={(v) => setTolerance(v)}
                error={tolerance === undefined || tolerance < 0 || tolerance > 240 ? "Entre 0 y 240 minutos" : undefined}
              />
              <div>
                <ITText className="text-sm font-medium text-slate-700 mb-2">Días que aplica</ITText>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_SHORT.map((label, day) => {
                    const on = days.includes(day);
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleDay(day)}
                        className={`w-12 py-2 rounded-lg text-xs font-bold border transition-colors ${
                          on
                            ? "bg-[var(--color-primary)] border-transparent text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <ToggleRow title="Programación activa" description="Si se desactiva deja de generar pendientes." isOn={active} onToggle={setActive} />
          </section>
        </div>

        <div className="flex justify-end items-center pt-5 mt-4 border-t border-slate-100 gap-3">
          <ITButton variant="filled" color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </ITButton>
          <ITButton color="primary" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? <ITLoader size="sm" /> : plan ? "Guardar cambios" : "Programar"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

const ToggleRow = ({
  title,
  description,
  isOn,
  onToggle,
}: {
  title: string;
  description: string;
  isOn: boolean;
  onToggle: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200">
    <div>
      <ITText className="text-sm font-bold text-slate-800">{title}</ITText>
      <ITText className="text-xs text-slate-500">{description}</ITText>
    </div>
    <ITSlideToggle isOn={isOn} onToggle={onToggle} />
  </div>
);
