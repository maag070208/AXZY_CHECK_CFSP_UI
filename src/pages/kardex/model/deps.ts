/**
 * Dependencias del view-model de Kardex. Único punto que toca Redux.
 */
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { deleteKardexEntry, fetchKardexTable, type KardexEntry } from "@entities/kardex";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface KardexDeps {
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<KardexEntry>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useKardexDeps = (): KardexDeps => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      fetchTable: fetchKardexTable,
      remove: deleteKardexEntry,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [dispatch],
  );
};
