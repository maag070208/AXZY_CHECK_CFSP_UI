/**
 * API de alertas de pánico. `request` de `@shared/api` nunca lanza.
 */
import {
  get,
  post,
  put,
  toTableResponse,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type { PanicAlert, PanicAlertStatus } from "../model/types";

export type PanicAlertListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sort?: { key: string; direction: "asc" | "desc" };
};

export const fetchPanicAlertsTable = async (
  params: PanicAlertListParams,
): Promise<ITDataTableResponse<PanicAlert>> => {
  const filters: Record<string, string> = {};
  if (params.search) filters.search = params.search;
  if (params.status && params.status !== "ALL") filters.status = params.status;

  const res = await post<Paginated<PanicAlert>>("/panic-alerts/datatable", {
    page: params.page,
    limit: params.limit,
    filters,
    sort: params.sort ?? { key: "createdAt", direction: "desc" },
  });

  return toTableResponse<PanicAlert>(res);
};

export const getPanicAlertById = (id: string): Promise<TResult<PanicAlert>> =>
  get<PanicAlert>(`/panic-alerts/${id}`);

export const resolvePanicAlert = (
  id: string,
  resolutionComment?: string,
  status: PanicAlertStatus = "RESOLVED",
): Promise<TResult<PanicAlert>> =>
  put<PanicAlert>(`/panic-alerts/${id}/resolve`, { resolutionComment, status });
