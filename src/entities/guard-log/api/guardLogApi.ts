/**
 * API de registros de asistencia.
 *
 * `request` de `@shared/api` nunca lanza: siempre resuelve `TResult`.
 */
import {
  patch,
  post,
  remove,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import { toTableResponse } from "@shared/api";
import type { GuardLoginLog } from "../model/types";

export const clockOut = (guardId: string): Promise<TResult<GuardLoginLog>> =>
  patch<GuardLoginLog>("/guard-logs/clock-out", { guardId });

export const deleteGuardLog = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/guard-logs/${id}`);

/** Parámetros extra que viajan dentro de `filters` para este endpoint. */
export type GuardLogTableParams = ITDataTableFetchParams & {
  sort?: { key: string; direction: "asc" | "desc" };
};

export const fetchGuardLogsTable = async (
  params: GuardLogTableParams,
): Promise<ITDataTableResponse<GuardLoginLog>> => {
  const res = await post<Paginated<GuardLoginLog>>("/guard-logs/datatable", params);
  return toTableResponse<GuardLoginLog>(res);
};
