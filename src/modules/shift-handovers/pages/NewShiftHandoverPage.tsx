import {
  ITBadget,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITInputNumber,
  ITLoader,
  ITPage,
  ITSearchSelect,
  ITSelect,
  ITSlideToggle,
  ITText,
  ITTextarea,
  ITTimePicker,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { FaClipboardCheck, FaPlus, FaSave, FaTrash, FaUsers } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChecklistGrid, mapToAnswers } from "@app/core/components/ChecklistGrid";
import { SectionTitle } from "@app/core/components/SectionTitle";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ICatalogItem } from "@app/core/types/catalog.types";
import { IChecklistItemDefinition, IShiftPlan } from "@app/core/types/supervision.types";
import { todayShiftDate } from "@app/core/utils/supervision.utils";
import { getSchedules, getUsersBySchedule, Schedule } from "@modules/schedules/SchedulesService";
import { getShiftPlans } from "@modules/shift-plans/services/ShiftPlansService";
import { createShiftHandover, getHandoverCatalog } from "../services/ShiftHandoversService";

type GuardOption = ICatalogItem & { clientId?: string | null };

interface ElementRow {
  guardId: string;
  name: string;
  entryTime: string;
  observations: string;
}

const DEFAULT_TOLERANCE = 30;

const minutesLate = (entryTime: string, startTime: string): number => {
  const [eh, em] = entryTime.split(":").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;
  return diff;
};

const NewShiftHandoverPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const { data: clients } = useCatalog("client");
  const { data: guardsRaw } = useCatalog("guard");
  const guards = guardsRaw as GuardOption[];

  const [clientId, setClientId] = useState(params.get("clientId") ?? "");
  const [scheduleId, setScheduleId] = useState(params.get("scheduleId") ?? "");
  const [shiftDate, setShiftDate] = useState(params.get("shiftDate") ?? todayShiftDate());
  const [credentials, setCredentials] = useState<number | undefined>();
  const [tarjetones, setTarjetones] = useState<number | undefined>();
  const [novedades, setNovedades] = useState("");
  const [reportedToAdmin, setReportedToAdmin] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [elements, setElements] = useState<ElementRow[]>([]);
  const [draftGuard, setDraftGuard] = useState("");
  const [draftTime, setDraftTime] = useState("");

  const [catalog, setCatalog] = useState<IChecklistItemDefinition[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [plans, setPlans] = useState<IShiftPlan[]>([]);
  const [loadingShiftGuards, setLoadingShiftGuards] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getHandoverCatalog(), getSchedules()])
      .then(([cat, sch]) => {
        if (cat.success) setCatalog(cat.data);
        setSchedules(sch.filter((s) => s.active));
      })
      .catch(() => dispatch(showToast({ message: "No se pudieron cargar los catálogos", type: "error" })));
  }, [dispatch]);

  useEffect(() => {
    if (!clientId) {
      setPlans([]);
      return;
    }
    getShiftPlans(clientId)
      .then((res) => setPlans(res.success ? res.data : []))
      .catch(() => setPlans([]));
  }, [clientId]);

  // Primero los turnos programados para el cliente; luego el resto.
  const scheduleOptions = useMemo(() => {
    const planned = new Set(plans.filter((p) => p.active && p.requireHandover).map((p) => p.scheduleId));
    return [...schedules]
      .sort((a, b) => Number(planned.has(b.id)) - Number(planned.has(a.id)) || a.startTime.localeCompare(b.startTime))
      .map((s) => ({
        label: `${s.name} (${s.startTime} - ${s.endTime})${planned.has(s.id) ? " · programado" : ""}`,
        value: s.id,
      }));
  }, [schedules, plans]);

  const schedule = schedules.find((s) => s.id === scheduleId);
  const tolerance = plans.find((p) => p.scheduleId === scheduleId)?.toleranceMinutes ?? DEFAULT_TOLERANCE;
  const clientGuards = useMemo(
    () => guards.filter((g) => !clientId || g.clientId === clientId),
    [guards, clientId],
  );
  const guardOptions = clientGuards
    .filter((g) => !elements.some((e) => e.guardId === String(g.id)))
    .map((g) => ({ label: g.value, value: String(g.id) }));

  useEffect(() => {
    if (schedule && !draftTime) setDraftTime(schedule.startTime);
  }, [schedule, draftTime]);

  const addElement = () => {
    const guard = guards.find((g) => String(g.id) === draftGuard);
    if (!guard || !draftTime) return;
    setElements((prev) => [...prev, { guardId: String(guard.id), name: guard.value, entryTime: draftTime, observations: "" }]);
    setDraftGuard("");
  };

  const loadShiftGuards = async () => {
    if (!scheduleId || !schedule) return;
    setLoadingShiftGuards(true);
    try {
      const users: { id: string; active: boolean }[] = await getUsersBySchedule(scheduleId);
      const ids = new Set(users.filter((u) => u.active).map((u) => u.id));
      const toAdd = clientGuards.filter((g) => ids.has(String(g.id)) && !elements.some((e) => e.guardId === String(g.id)));
      if (toAdd.length === 0) {
        dispatch(showToast({ message: "No hay más guardias de este cliente asignados a ese turno", type: "info" }));
        return;
      }
      setElements((prev) => [
        ...prev,
        ...toAdd.map((g) => ({ guardId: String(g.id), name: g.value, entryTime: schedule.startTime, observations: "" })),
      ]);
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] ?? "No se pudieron cargar los guardias del turno", type: "error" }));
    } finally {
      setLoadingShiftGuards(false);
    }
  };

  const isValid = !!clientId && !!scheduleId && !!shiftDate && elements.length > 0 && catalog.length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await createShiftHandover({
        clientId,
        scheduleId,
        shiftDate,
        credentialsCount: credentials ?? null,
        tarjetonesCount: tarjetones ?? null,
        novedades: novedades.trim() || null,
        checklist: mapToAnswers(catalog, checklist),
        reportedToAdmin,
        elements: elements.map((e) => ({
          guardId: e.guardId,
          entryTime: e.entryTime,
          observations: e.observations.trim() || null,
        })),
      });
      if (res.success) {
        dispatch(showToast({ message: "Entrega de turno registrada", type: "success" }));
        navigate(`/shift-handovers?detalle=${res.data.id}`);
      } else {
        dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo guardar", type: "error" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] ?? "No se pudo guardar la entrega", type: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (
    <ITButton variant="filled" color="primary" onClick={handleSave} disabled={saving || !isValid}>
      <ITFlex align="center" gap={1}>
        {saving ? <ITLoader size="sm" /> : <FaSave size={12} />}
        <ITText className="font-bold text-[11px]">Registrar entrega</ITText>
      </ITFlex>
    </ITButton>
  );

  return (
    <ITPage
      noPadding
      maxWidth="5xl"
      title="Nueva entrega de turno"
      description="Registra quién recibe el turno, a qué hora llegó y el estado del equipo."
      icon={<FaClipboardCheck size={20} />}
      backAction={() => navigate("/shift-handovers")}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/home") },
        { label: "Entregas de turno", onClick: () => navigate("/shift-handovers") },
        { label: "Nueva" },
      ]}
      actions={saveButton}
    >
      <Card>
        <SectionTitle>1. Turno</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ITSearchSelect
            label="Cliente"
            placeholder="Selecciona el cliente"
            required
            options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
            value={clientId}
            onChange={(v) => {
              setClientId(String(v));
              setElements([]);
            }}
          />
          <ITSelect
            name="scheduleId"
            label="Turno"
            required
            placeholder="Selecciona el turno"
            options={scheduleOptions}
            value={scheduleId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScheduleId(e.target.value)}
          />
          <ITDatePicker
            name="shiftDate"
            label="Fecha de inicio del turno"
            required
            maxDate={new Date()}
            value={dayjs(shiftDate).toDate()}
            onChange={(e) => {
              const value = e.target.value;
              if (value instanceof Date) setShiftDate(dayjs(value).format("YYYY-MM-DD"));
            }}
          />
        </div>
        {schedule && (
          <ITText className="text-xs text-slate-500">
            Inicio {schedule.startTime} · fin {schedule.endTime} · tolerancia de {tolerance} min para considerar llegada puntual.
          </ITText>
        )}
      </Card>

      <Card>
        <SectionTitle
          aside={
            <ITButton variant="outlined" color="secondary" size="sm" onClick={loadShiftGuards} disabled={!clientId || !scheduleId || loadingShiftGuards}>
              <ITFlex align="center" gap={1}>
                {loadingShiftGuards ? <ITLoader size="sm" /> : <FaUsers size={11} />}
                <span>Cargar guardias del turno</span>
              </ITFlex>
            </ITButton>
          }
        >
          2. Elementos que reciben el turno
        </SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 items-end p-3 rounded-xl bg-slate-50 border border-slate-100">
          <ITSearchSelect
            label="Guardia"
            placeholder={clientId ? "Selecciona un guardia" : "Primero elige el cliente"}
            disabled={!clientId}
            options={guardOptions}
            value={draftGuard}
            onChange={(v) => setDraftGuard(String(v))}
            noResultsMessage="Sin guardias disponibles"
          />
          <ITTimePicker
            name="entryTime"
            label="Hora de entrada"
            value={draftTime}
            onChange={(e: { target: { value: string } }) => setDraftTime(e.target.value)}
          />
          <ITButton color="primary" onClick={addElement} disabled={!draftGuard || !draftTime}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={11} /> <span>Agregar</span>
            </ITFlex>
          </ITButton>
        </div>

        {elements.length === 0 ? (
          <div className="py-6 text-center rounded-xl border border-dashed border-slate-200">
            <ITText className="text-xs italic text-slate-400">Aún no hay elementos. Agrega a los guardias que reciben el turno.</ITText>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {elements.map((el, idx) => {
              const late = schedule ? minutesLate(el.entryTime, schedule.startTime) : 0;
              const punctual = late <= tolerance;
              return (
                <div key={el.guardId} className="grid grid-cols-1 md:grid-cols-[1fr_120px_1fr_auto] gap-3 items-center px-4 py-3 bg-white">
                  <div className="min-w-0">
                    <ITText className="text-sm font-bold text-slate-800 truncate">{el.name}</ITText>
                    {schedule && (
                      <ITBadget color={punctual ? "success" : "danger"} size="sm" className="mt-1">
                        {punctual ? "A tiempo" : `Retardo ${late} min`}
                      </ITBadget>
                    )}
                  </div>
                  <ITTimePicker
                    name={`entry-${idx}`}
                    value={el.entryTime}
                    onChange={(e: { target: { value: string } }) =>
                      setElements((prev) => prev.map((p, i) => (i === idx ? { ...p, entryTime: e.target.value } : p)))
                    }
                  />
                  <ITInput
                    name={`observations-${idx}`}
                    placeholder="Observaciones (opcional)"
                    value={el.observations}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setElements((prev) => prev.map((p, i) => (i === idx ? { ...p, observations: e.target.value } : p)))
                    }
                  />
                  <ITButton variant="text" color="error" size="sm" title="Quitar" onClick={() => setElements((prev) => prev.filter((_, i) => i !== idx))}>
                    <FaTrash size={11} />
                  </ITButton>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>3. Caseta</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ITInputNumber name="credentials" label="No. de credenciales" min={0} value={credentials ?? null} onChange={(v) => setCredentials(v)} />
          <ITInputNumber name="tarjetones" label="No. de tarjetones" min={0} value={tarjetones ?? null} onChange={(v) => setTarjetones(v)} />
        </div>
        <ITTextarea
          name="novedades"
          label="Novedades del turno saliente"
          placeholder="Pendientes, eventos relevantes, consignas especiales..."
          rows={4}
          maxLength={2000}
          value={novedades}
          onChange={setNovedades}
        />
      </Card>

      <Card>
        <SectionTitle
          aside={
            <ITText className="text-[11px] font-bold text-slate-400 tabular-nums">
              {catalog.filter((c) => checklist[c.key]).length}/{catalog.length} verificados
            </ITText>
          }
        >
          4. Verificación de equipo
        </SectionTitle>
        {catalog.length ? (
          <ChecklistGrid catalog={catalog} values={checklist} onToggle={(key, ok) => setChecklist((p) => ({ ...p, [key]: ok }))} />
        ) : (
          <div className="py-8 flex justify-center">
            <ITLoader size="md" />
          </div>
        )}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <ITText className="text-sm font-semibold text-slate-700">Se reportaron las novedades a la administración</ITText>
          <ITSlideToggle isOn={reportedToAdmin} onToggle={setReportedToAdmin} />
        </div>
      </Card>

      <div className="flex justify-end gap-3 pb-6">
        <ITButton variant="filled" color="secondary" onClick={() => navigate("/shift-handovers")} disabled={saving}>
          Cancelar
        </ITButton>
        {saveButton}
      </div>
    </ITPage>
  );
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <section className="space-y-5 p-5 md:p-6 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    {children}
  </section>
);

export default NewShiftHandoverPage;
