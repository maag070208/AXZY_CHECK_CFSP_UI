/**
 * View-model de entregas de turno.
 *
 * La vista queda como puro render: ni axios ni el servicio del módulo.
 */
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteShiftHandover,
  fetchShiftHandoversTable,
  type IShiftHandoverListItem,
} from "@entities/supervision";
import type { ITDataTableFetchParams, ITDataTableResponse } from "@shared/api";

/** Traduce los filtros por columna de la tabla a los filtros de la API. */
export const toHandoverApiParams = (params: ITDataTableFetchParams): ITDataTableFetchParams => {
  const f = params.filters ?? {};
  const range = Array.isArray(f.shiftDate)
    ? (f.shiftDate as [Date | null, Date | null])
    : [null, null];

  return {
    ...params,
    filters: {
      ...(f.search ? { search: String(f.search) } : {}),
      ...(f.clientId ? { clientId: String(f.clientId) } : {}),
      ...(range[0] ? { dateFrom: dayjs(range[0]).format("YYYY-MM-DD") } : {}),
      ...(range[1] ? { dateTo: dayjs(range[1]).format("YYYY-MM-DD") } : {}),
    },
  };
};

export const useShiftHandoversPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reloadKey, setReloadKey] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(searchParams.get("detalle"));
  const [toDelete, setToDelete] = useState<IShiftHandoverListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notify = useCallback(
    (message: string, type: "success" | "error") =>
      dispatch(showToast({ message, type })),
    [dispatch],
  );

  const closeDetail = useCallback(() => {
    setDetailId(null);
    if (searchParams.has("detalle")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  const fetchData = useCallback(
    (params: ITDataTableFetchParams): Promise<ITDataTableResponse<IShiftHandoverListItem>> =>
      fetchShiftHandoversTable(toHandoverApiParams(params)),
    [],
  );

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const target = toDelete;
    setDeleting(true);

    const res = await deleteShiftHandover(target.id);

    setDeleting(false);
    setToDelete(null);

    if (res.success) {
      notify("Entrega eliminada", "success");
      setReloadKey((k) => k + 1);
    } else {
      notify(res.messages?.[0] ?? "No se pudo eliminar", "error");
    }
  }, [toDelete, notify]);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    reloadKey,
    refresh,
    detailId,
    setDetailId,
    closeDetail,
    toDelete,
    setToDelete,
    deleting,
    confirmDelete,
    fetchData,
  };
};

export type ShiftHandoversViewModel = ReturnType<typeof useShiftHandoversPage>;
