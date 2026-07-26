import { get } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface IPendingCounts {
  incidents: number;
  maintenances: number;
  disciplines: number;
  activeRounds: number;
  panicAlerts: number;
}

export type OperationalRole = "GUARD" | "SHIFT" | "MAINT";

export interface IRoleBreakdown {
  guards: number;
  shift: number;
  maintenance: number;
}

export interface IActiveBreakdown {
  total: number;
  guards: number;
  shift: number;
  maintenance: number;
}

export interface IDashboardOverview {
  totalGuards: number;
  activeGuardsNow: number;
  totalBreakdown: IRoleBreakdown;
  activeBreakdown: IActiveBreakdown;
  totalClients: number;
  totalLocations: number;
  totalAssignments: number;
  pendingCounts: IPendingCounts;
  generatedAt: string;
  scope: "ALL" | "CLIENT";
}

export interface IActiveGuard {
  id: string;
  name: string;
  lastName: string;
  username: string;
  role: OperationalRole;
  clientId: string | null;
  clientName: string | null;
  isLoggedIn: boolean;
  currentRoundId: string | null;
  currentRoundStartTime: string | null;
  currentLocationName: string | null;
  lastKardexAt: string | null;
  lastKardexLocation: string | null;
}

export type ActivityType =
  | "incident"
  | "maintenance"
  | "discipline"
  | "panic"
  | "round"
  | "kardex";

export interface IActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  guardId?: string;
  guardName?: string;
  clientId?: string | null;
  clientName?: string | null;
  status?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface IPanicAlertListItem {
  id: string;
  title: string;
  description: string | null;
  guardId: string;
  guardName: string;
  clientId: string | null;
  clientName: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

export const getDashboardOverview = async (): Promise<
  TResult<IDashboardOverview>
> => {
  return get<IDashboardOverview>("/dashboard/overview");
};

export const getDashboardActiveGuards = async (): Promise<
  TResult<IActiveGuard[]>
> => {
  return get<IActiveGuard[]>("/dashboard/active-guards");
};

export const getDashboardPendingCounts = async (): Promise<
  TResult<IPendingCounts>
> => {
  return get<IPendingCounts>("/dashboard/pending-counts");
};

export const getDashboardRecentActivity = async (
  limit: number = 20,
): Promise<TResult<IActivityItem[]>> => {
  return get<IActivityItem[]>("/dashboard/recent-activity", {
    params: { limit },
  });
};

export const getDashboardPanicAlerts = async (
  limit: number = 10,
): Promise<TResult<IPanicAlertListItem[]>> => {
  return get<IPanicAlertListItem[]>("/dashboard/panic-alerts", {
    params: { limit },
  });
};
