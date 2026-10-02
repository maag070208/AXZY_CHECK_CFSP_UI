/**
 * View-model de verificación de uniformes.
 *
 * La vista queda como puro render: ni axios ni el servicio del módulo.
 */
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteUniformCheck,
  fetchUniformChecksTable,
  getUniformCheck,
  type IUniformCheck,
} from "@entities/supervision";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";

/** Traduce los filtros por columna de la tabla a los filtros de la API. */
export const toUniformApiParams = (params: ITDataTableFetchParams): ITDataTableFetchParams => {
  const f = params.filters ?? {};
  const range = Array.isArray(f.shiftDate)
    ? (f.shiftDate as [Date | null, Date | null])
    : [null, null];

  return {
    ...params,
    filters: {
      ...(f.guard ? { search: String(f.guard) } : {}),
      ...(f.clientId ? { clientId: String(f.clientId) } : {}),
      ...(f.compliant ? { compliant: String(f.compliant) } : {}),
      ...(range[0] ? { dateFrom: dayjs(range[0]).format("YYYY-MM-DD") } : {}),
      ...(range[1] ? { dateTo: dayjs(range[1]).format("YYYY-MM-DD") } : {}),
    },
  };
};

export const useUniformChecksPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(searchParams.get("nuevo") === "1");
  const [detail, setDetail] = useState<IUniformCheck | null>(null);
  const [toDelete, setToDelete] = useState<IUniformCheck | null>(null);
  const [deleting, setDeleting] = useState(false);

  const prefillGuardId = searchParams.get("guardId") ?? undefined;
  const prefillShiftDate = searchParams.get("shiftDate") ?? undefined;

  const notify = useCallback(
    (message: string, type: "success" | "error") => dispatch(showToast({ message, type })),
    [dispatch],
  );

  // Se llega desde la agenda con `?detalle=<id>`.
  const detailParam = searchParams.get("detalle");
  useEffect(() => {
    if (!detailParam) return;
    void getUniformCheck(detailParam).then((res) => {
      if (res.success && res.data) setDetail(res.data);
      else notify("No se encontró la revisión", "error");
    });
  }, [detailParam, notify]);

  const closeDetail = useCallback(() => {
    setDetail(null);
    if (searchParams.has("detalle")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    if (searchParams.has("nuevo")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<IUniformCheck>> =>
      fetchUniformChecksTable(toUniformApiParams(params)),
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const target = toDelete;
    setDeleting(true);

    const res = await deleteUniformCheck(target.id);

    setDeleting(false);
    setToDelete(null);

    if (res.success) {
      notify("Revisión eliminada", "success");
      setReloadKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] ?? "No se pudo eliminar", "error");
    }
  }, [toDelete, notify]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    reloadKey,
    refresh,
    formOpen,
    setFormOpen,
    closeForm,
    detail,
    setDetail,
    closeDetail,
    toDelete,
    setToDelete,
    deleting,
    confirmDelete,
    fetchData,
    prefillGuardId,
    prefillShiftDate,
  };
};

export type UniformChecksViewModel = ReturnType<typeof useUniformChecksPage>;
