/**
 * API del dashboard. `request` de `@shared/api` nunca lanza.
 *
 * Antes las URLs se construían a mano con `?clientId=` concatenado; ahora el
 * cliente HTTP recibe `params` y se encarga del escapado.
 */
import { get, type TResult } from "@shared/api";
import type { ILiveDashboard } from "../model/types";
import type {
  IActiveGuard,
  IActivityItem,
  IAttendanceReport,
  IDashboardOverview,
  IPanicAlertListItem,
  IPendingCounts,
} from "../model/dashboard.types";

export const getDashboardOverview = (): Promise<TResult<IDashboardOverview>> =>
  get<IDashboardOverview>("/dashboard/overview");

export const getDashboardActiveGuards = (): Promise<TResult<IActiveGuard[]>> =>
  get<IActiveGuard[]>("/dashboard/active-guards");

export const getDashboardPendingCounts = (): Promise<TResult<IPendingCounts>> =>
  get<IPendingCounts>("/dashboard/pending-counts");

export const getDashboardRecentActivity = (limit = 20): Promise<TResult<IActivityItem[]>> =>
  get<IActivityItem[]>("/dashboard/recent-activity", { params: { limit } });

export const getDashboardPanicAlerts = (limit = 10): Promise<TResult<IPanicAlertListItem[]>> =>
  get<IPanicAlertListItem[]>("/dashboard/panic-alerts", { params: { limit } });

/** Estado operativo en vivo: KPIs, alertas, rondas, mapa y cumplimiento. */
export const getLiveDashboard = (clientId?: string): Promise<TResult<ILiveDashboard>> =>
  get<ILiveDashboard>("/dashboard/live", clientId ? { params: { clientId } } : undefined);

/** Asistencia del día: quién está en turno, tarde o ausente. */
export const getDashboardAttendance = (
  clientId?: string,
  date?: string,
): Promise<TResult<IAttendanceReport>> =>
  get<IAttendanceReport>("/dashboard/attendance", {
    params: { ...(clientId ? { clientId } : {}), ...(date ? { date } : {}) },
  });
