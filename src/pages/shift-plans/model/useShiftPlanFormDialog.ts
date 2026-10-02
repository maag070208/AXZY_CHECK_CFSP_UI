/**
 * View-model del formulario de programación de turnos.
 *
 * La lógica se extrajo tal cual; el acceso a datos ya pasaba por las entidades.
 */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { listSchedules, type Schedule } from "@entities/schedule";
import { createShiftPlan, updateShiftPlan, type IShiftPlan } from "@entities/supervision";

export interface ShiftPlanFormDialogProps {
  isOpen: boolean;
  plan: IShiftPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Días de la semana y tolerancia por defecto del formulario. */
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const DEFAULT_TOLERANCE = 30;

export const useShiftPlanFormDialog = ({ isOpen, plan, onSaved }: ShiftPlanFormDialogProps) => {
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
      listSchedules()
        .then((res) => setSchedules(res.success && Array.isArray(res.data) ? res.data.filter((s) => s.active) : []))
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


  return {
    isValid,
    clients,
    schedules,
    clientId,
    setClientId,
    scheduleId,
    setScheduleId,
    requireHandover,
    setRequireHandover,
    requireUniform,
    setRequireUniform,
    tolerance,
    setTolerance,
    days,
    setDays,
    active,
    setActive,
    saving,
    toggleDay,
    handleSave,
  };
};

export type ShiftPlanFormDialogViewModel = ReturnType<typeof useShiftPlanFormDialog>;
