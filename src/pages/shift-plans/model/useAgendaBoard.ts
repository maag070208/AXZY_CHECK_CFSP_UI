/**
 * View-model de la agenda del día.
 *
 * La vista queda como puro render. Antes `AgendaBoard` llamaba a `getAgenda`
 * directamente y orquestaba el refresco por evento en vivo y por intervalo.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { getAgenda, type IAgenda, type IAgendaItem } from "@entities/supervision";
import { todayShiftDate } from "@app/core/utils/supervision.utils";

export type AgendaStatusFilter = "all" | "pending" | "done";

/** Estados que muestra cada filtro. `null` = todos. */
export const FILTER_STATUSES: Record<AgendaStatusFilter, string[] | null> = {
  all: null,
  pending: ["UPCOMING", "IN_WINDOW", "OVERDUE", "MISSED"],
  done: ["DONE"],
};

const REFRESH_MS = 60_000;

/** Un turno del día: su entrega y sus revisiones de uniforme. */
export interface ShiftGroup {
  key: string;
  item: IAgendaItem;
  handover: IAgendaItem | null;
  uniforms: IAgendaItem[];
}

export interface AgendaClientGroup {
  client: string;
  shifts: ShiftGroup[];
}

export interface UseAgendaBoardOptions {
  reloadKey: number;
}

export const useAgendaBoard = ({ reloadKey }: UseAgendaBoardOptions) => {
  const activityEvents = useSelector((state: AppState) => state.activity.events);

  const [date, setDate] = useState(todayShiftDate());
  const [clientId, setClientId] = useState("");
  const [filter, setFilter] = useState<AgendaStatusFilter>("all");
  const [agenda, setAgenda] = useState<IAgenda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      const res = await getAgenda(date, clientId || undefined);

      if (res.success && res.data) setAgenda(res.data);
      else setError(res.messages?.[0] ?? "No se pudo cargar la agenda");

      setLoading(false);
    },
    [date, clientId],
  );

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  // Se refresca al llegar un registro en vivo y, de respaldo, cada minuto:
  // los estados cambian con la hora aunque nadie registre nada.
  const lastEventRef = useRef<string | null>(null);
  useEffect(() => {
    const latest = activityEvents[0];
    if (!latest || latest.id === lastEventRef.current) return;
    lastEventRef.current = latest.id;

    if (latest.type === "shift_handover" || latest.type === "uniform_check") void load(true);
  }, [activityEvents, load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(true), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  /** Agenda agrupada por cliente y turno, ya filtrada por estado. */
  const groupsByClient = useMemo<AgendaClientGroup[]>(() => {
    const allowed = FILTER_STATUSES[filter];
    const items = (agenda?.items ?? []).filter((i) => !allowed || allowed.includes(i.status));

    const byClient = new Map<string, Map<string, ShiftGroup>>();
    for (const item of items) {
      const shifts = byClient.get(item.client.name) ?? new Map<string, ShiftGroup>();
      const key = `${item.planId}:${item.shiftDate}`;
      const group = shifts.get(key) ?? { key, item, handover: null, uniforms: [] };

      if (item.type === "HANDOVER") group.handover = item;
      else group.uniforms.push(item);

      shifts.set(key, group);
      byClient.set(item.client.name, shifts);
    }

    return [...byClient.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([client, shifts]) => ({ client, shifts: [...shifts.values()] }));
  }, [agenda, filter]);

  return {
    date,
    setDate,
    clientId,
    setClientId,
    filter,
    setFilter,
    agenda,
    groupsByClient,
    loading,
    error,
    reload: load,
  };
};

export type AgendaBoardViewModel = ReturnType<typeof useAgendaBoard>;
