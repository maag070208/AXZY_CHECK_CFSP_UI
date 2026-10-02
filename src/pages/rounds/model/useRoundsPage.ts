import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Round } from "@entities/round";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";
import { TONES } from "@shared/ui";
import type { RoundsDeps } from "./deps";

dayjs.extend(utc);
dayjs.extend(timezone);

export const OPERATIONS_TIMEZONE = "America/Tijuana";

export type RoundStatusFilter = "ALL" | "IN_PROGRESS" | "COMPLETED";

/**
 * Estado visual de una ronda.
 *
 * Antes se decidía con hex crudos (`#fef2f2`, `#ecfdf5`) y clases Tailwind
 * (`bg-emerald-500`) que no existen en la paleta del tema y se rompen en modo
 * oscuro. Ahora se resuelve con tonos semánticos de `@shared/ui`.
 */
export const roundVisualState = (round: Round) => {
  const scans = round._count?.kardexEntries ?? 0;

  if (scans === 0) {
    return { label: "Sin actividad", color: "error" as const, row: TONES.danger.soft, dot: TONES.danger.dot };
  }
  if (round.status === "COMPLETED") {
    return { label: "Completada", color: "success" as const, row: TONES.success.soft, dot: TONES.success.dot };
  }
  return { label: "En curso", color: "warning" as const, row: TONES.warning.soft, dot: TONES.warning.dot };
};

/** View-model del listado de rondas. */
export const useRoundsPage = ({ role, clientId, fetchTable, finish, remove, loadRouteTitles, notify }: RoundsDeps) => {
  const [searchParams] = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<[Date, Date]>([
    dayjs().tz(OPERATIONS_TIMEZONE).toDate(),
    dayjs().tz(OPERATIONS_TIMEZONE).toDate(),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoundStatusFilter>("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string>(searchParams.get("clientId") ?? "");
  const [refreshKey, setRefreshKey] = useState(0);

  const [routesMap, setRoutesMap] = useState<Record<string, string>>({});
  const [roundToFinishId, setRoundToFinishId] = useState<string | null>(null);
  const [roundToDeleteId, setRoundToDeleteId] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isResident = role === "RESDN";

  useEffect(() => {
    void loadRouteTitles().then(setRoutesMap);
  }, [loadRouteTitles]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, unknown> = {};

    if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
      filters.date = [
        dayjs(selectedDate[0]).tz(OPERATIONS_TIMEZONE).startOf("day").format(),
        dayjs(selectedDate[1]).tz(OPERATIONS_TIMEZONE).endOf("day").format(),
      ];
    }
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (statusFilter !== "ALL") filters.status = statusFilter;

    // Un residente sólo ve las rondas de su propio cliente.
    if (selectedClientId) filters.clientId = selectedClientId;
    else if (isResident && clientId) filters.clientId = clientId;

    return filters;
  }, [selectedDate, searchTerm, statusFilter, selectedClientId, isResident, clientId]);

  const memoizedFetch = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<Round>> =>
      fetchTable({
        ...params,
        filters: { ...params.filters, ...externalFilters } as never,
        sort: params.sort ?? { key: "startTime", direction: "desc" },
      }),
    [fetchTable, externalFilters],
  );

  const refresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  const confirmDeleteRound = useCallback(async () => {
    if (!roundToDeleteId || isDeleting) return;
    const target = roundToDeleteId;
    setIsDeleting(true);

    const res = await remove(target);

    setIsDeleting(false);
    setRoundToDeleteId(null);

    if (res.success) {
      notify("Ronda eliminada", "success");
      refresh();
    } else {
      notify(res.messages?.[0] || "Error al eliminar ronda", "error");
    }
  }, [roundToDeleteId, isDeleting, remove, notify, refresh]);

  const handleEndRound = useCallback(async () => {
    if (!roundToFinishId || isFinishing) return;
    const target = roundToFinishId;
    setIsFinishing(true);

    const res = await finish(target);

    setIsFinishing(false);
    setRoundToFinishId(null);

    if (res.success) {
      notify("Ronda finalizada", "success");
      refresh();
    } else {
      notify(res.messages?.[0] || "Error al finalizar la ronda", "error");
    }
  }, [roundToFinishId, isFinishing, finish, notify, refresh]);

  return {
    isResident,
    routesMap,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedClientId,
    setSelectedClientId,
    externalFilters,
    memoizedFetch,
    refreshKey,
    refresh,
    roundToFinishId,
    setRoundToFinishId,
    roundToDeleteId,
    setRoundToDeleteId,
    isFinishing,
    isDeleting,
    confirmDeleteRound,
    handleEndRound,
  };
};

export type RoundsViewModel = ReturnType<typeof useRoundsPage>;
