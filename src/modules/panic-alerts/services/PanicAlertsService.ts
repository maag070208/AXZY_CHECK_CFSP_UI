import { get, post, put } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export type PanicAlertStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

export interface IPanicAlertGuard {
  id: string;
  name: string;
  lastName: string | null;
  username: string;
}

export interface IPanicAlertClient {
  id: string;
  name: string;
}

export interface IPanicAlertResolver {
  id: string;
  name: string;
  lastName: string | null;
}

export interface IPanicAlert {
  id: string;
  guardId: string;
  guard: IPanicAlertGuard;
  clientId: string | null;
  client: IPanicAlertClient | null;
  source: string;
  triggerLatitude: number | null;
  triggerLongitude: number | null;
  triggerAccuracy: number | null;
  message: string | null;
  status: PanicAlertStatus;
  resolutionComment: string | null;
  resolvedById: string | null;
  resolvedBy: IPanicAlertResolver | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface IPaginatedParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sort?: { key: string; direction: "asc" | "desc" };
}

interface IPaginatedResponse<T> {
  data: T[];
  total: number;
}

export const getPaginatedPanicAlerts = async (
  params: IPaginatedParams,
): Promise<IPaginatedResponse<IPanicAlert>> => {
  const filters: Record<string, string> = {};
  if (params.search) filters.search = params.search;
  if (params.status && params.status !== "ALL") filters.status = params.status;

  const res = await post<{ rows: IPanicAlert[]; total: number }>(
    "/panic-alerts/datatable",
    {
      page: params.page,
      limit: params.limit,
      filters,
      sort: params.sort ?? { key: "createdAt", direction: "desc" },
    },
  );

  if (!res.success || !res.data) {
    return { data: [], total: 0 };
  }

  return {
    data: res.data.rows ?? [],
    total: res.data.total ?? 0,
  };
};

export const getRecentPanicAlerts = async (
  limit: number = 10,
): Promise<TResult<IPanicAlert[]>> => {
  return get<IPanicAlert[]>("/panic-alerts/recent", { params: { limit } });
};

export const getPanicAlertById = async (
  id: string,
): Promise<TResult<IPanicAlert>> => {
  return get<IPanicAlert>(`/panic-alerts/${id}`);
};

export const resolvePanicAlert = async (
  id: string,
  resolutionComment?: string,
  status: PanicAlertStatus = "RESOLVED",
): Promise<TResult<IPanicAlert>> => {
  return put<IPanicAlert>(`/panic-alerts/${id}/resolve`, {
    resolutionComment,
    status,
  });
};
