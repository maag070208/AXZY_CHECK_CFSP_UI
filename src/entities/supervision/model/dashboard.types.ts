/**
 * Agregados del monitoreo (dashboard).
 *
 * Viven en el mismo slice que el kernel de supervisión porque son su mismo
 * dominio: un slice de entidad no puede importar de otro.
 */
/**
 * Modelo de la entidad Dashboard (agregados del monitoreo en vivo).
 *
 * Endpoints verificados contra `API/src/modules/dashboard/dashboard.routes.ts`.
 */

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
