/**
 * View-model del alta de entrega de turno.
 *
 * La vista conserva `saveButton` (es JSX) y la maquetación por pasos.
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { todayShiftDate } from "@app/core/utils/supervision.utils";
import { getUsersBySchedule, listSchedules, type Schedule } from "@entities/schedule";
import {
  createShiftHandover,
  getHandoverCatalog,
  getShiftPlans,
  type IChecklistItemDefinition,
  type IShiftPlan,
} from "@entities/supervision";
import { mapToAnswers } from "@app/core/components/ChecklistGrid";
import type { ICatalogItem } from "@app/core/types/catalog.types";

export type GuardOption = ICatalogItem & { clientId?: string | null };

export interface ElementRow {
  guardId: string;
  name: string;
  entryTime: string;
  observations: string;
}

const DEFAULT_TOLERANCE = 30;

export const useNewShiftHandoverPage = () => {
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
    Promise.all([getHandoverCatalog(), listSchedules()])
      .then(([cat, sch]) => {
        if (cat.success) setCatalog(cat.data);
        setSchedules(sch.success && Array.isArray(sch.data) ? sch.data.filter((s) => s.active) : []);
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
      const usersRes = await getUsersBySchedule(scheduleId);
      const users: { id: string; active?: boolean }[] = usersRes.success && Array.isArray(usersRes.data) ? usersRes.data : [];
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

  return {
    clientId, setClientId, scheduleId, setScheduleId, shiftDate, setShiftDate,
    credentials, setCredentials, tarjetones, setTarjetones, novedades, setNovedades,
    reportedToAdmin, setReportedToAdmin, checklist, setChecklist, elements, setElements,
    draftGuard, setDraftGuard, draftTime, setDraftTime,
    clients, catalog, schedule, guardOptions, tolerance, loadingShiftGuards, scheduleOptions, saving,
    addElement, handleSave, loadShiftGuards, isValid, navigate,
  };
};

export type NewShiftHandoverViewModel = ReturnType<typeof useNewShiftHandoverPage>;
