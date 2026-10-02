/**
 * Contratos de la API para programación de turnos, entregas de turno,
 * revisiones de uniforme y dashboard en vivo. Reflejan los DTOs de
 * `API/src/modules/{shift-plans,shift-handovers,uniform-checks,dashboard}`.
 */

export interface IClientSummary {
  id: string;
  name: string;
}

export interface IScheduleSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface IPersonSummary {
  id: string;
  name: string;
  lastName: string | null;
}

export interface IChecklistItemDefinition {
  key: string;
  label: string;
  group: string;
}

export interface IChecklistAnswer {
  key: string;
  ok: boolean;
}

// ── Programación / agenda ──

export interface IShiftPlan {
  id: string;
  clientId: string;
  scheduleId: string;
  requireHandover: boolean;
  requireUniform: boolean;
  toleranceMinutes: number;
  daysOfWeek: number[];
  active: boolean;
  client: IClientSummary;
  schedule: IScheduleSummary;
  guardsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IShiftPlanCreate {
  clientId: string;
  scheduleId: string;
  requireHandover: boolean;
  requireUniform: boolean;
  toleranceMinutes: number;
  daysOfWeek: number[];
  active: boolean;
}

export type IShiftPlanUpdate = Partial<Omit<IShiftPlanCreate, "clientId" | "scheduleId">>;

export type AgendaStatus = "UPCOMING" | "IN_WINDOW" | "OVERDUE" | "MISSED" | "DONE";
export type AgendaItemType = "HANDOVER" | "UNIFORM";

export interface IAgendaRecord {
  id: string;
  createdAt: string;
  by: string | null;
  score?: number;
  compliant?: boolean;
}

export interface IAgendaItem {
  id: string;
  type: AgendaItemType;
  status: AgendaStatus;
  shiftDate: string;
  startAt: string;
  dueAt: string;
  endAt: string;
  planId: string;
  client: IClientSummary;
  schedule: IScheduleSummary;
  guard: IPersonSummary | null;
  record: IAgendaRecord | null;
}

export interface IAgendaSummary {
  total: number;
  done: number;
  inWindow: number;
  overdue: number;
  missed: number;
  upcoming: number;
  compliancePercent: number | null;
}

export interface IAgenda {
  dates: string[];
  generatedAt: string;
  items: IAgendaItem[];
  summary: IAgendaSummary;
  handoverSummary: IAgendaSummary;
  uniformSummary: IAgendaSummary;
}

// ── Entregas de turno ──

export interface IShiftHandoverElementInput {
  guardId: string;
  entryTime: string;
  observations?: string | null;
}

export interface IShiftHandoverCreate {
  clientId: string;
  scheduleId: string;
  shiftDate: string;
  credentialsCount?: number | null;
  tarjetonesCount?: number | null;
  novedades?: string | null;
  checklist: IChecklistAnswer[];
  reportedToAdmin: boolean;
  elements: IShiftHandoverElementInput[];
}

export interface IShiftHandoverListItem {
  id: string;
  shiftDate: string;
  credentialsCount: number | null;
  tarjetonesCount: number | null;
  reportedToAdmin: boolean;
  checklistOk: number;
  checklistTotal: number;
  elementsCount: number;
  lateCount: number;
  client: IClientSummary;
  schedule: IScheduleSummary;
  createdBy: IPersonSummary;
  createdAt: string;
}

export interface IShiftHandoverElement {
  id: string;
  entryTime: string;
  punctual: boolean;
  observations: string | null;
  guard: IPersonSummary;
}

export interface IShiftHandoverDetail extends IShiftHandoverListItem {
  novedades: string | null;
  checklist: IChecklistAnswer[];
  elements: IShiftHandoverElement[];
}

// ── Uniformes ──

export interface IUniformCatalog {
  items: IChecklistItemDefinition[];
  minCompliantScore: number;
}

export interface IUniformCheckCreate {
  guardId: string;
  shiftDate?: string;
  items: IChecklistAnswer[];
  notes?: string | null;
}

export interface IUniformCheck {
  id: string;
  shiftDate: string;
  score: number;
  compliant: boolean;
  notes: string | null;
  items: IChecklistAnswer[];
  guard: IPersonSummary;
  evaluatedBy: IPersonSummary;
  client: IClientSummary | null;
  schedule: IScheduleSummary | null;
  createdAt: string;
}

// ── Dashboard en vivo ──

export type LiveAlertType =
  | "PANIC"
  | "ROUND_STALLED"
  | "ROUND_ABANDONED"
  | "HANDOVER_OVERDUE"
  | "UNIFORM_OVERDUE"
  | "INCIDENT_OPEN";

export type LiveAlertSeverity = "critical" | "high" | "medium";

export interface ILiveAlert {
  id: string;
  type: LiveAlertType;
  severity: LiveAlertSeverity;
  title: string;
  detail: string | null;
  clientName: string | null;
  at: string | null;
  refId: string | null;
}

export type LiveRoundState = "ON_TRACK" | "STALLED" | "ABANDONED";

export interface ILiveRound {
  roundId: string;
  guard: IPersonSummary;
  clientName: string | null;
  routeId: string | null;
  routeTitle: string | null;
  startTime: string;
  elapsedMinutes: number;
  totalLocations: number | null;
  scannedCount: number;
  progressPercent: number | null;
  minutesSinceLastScan: number;
  lastScan: {
    locationName: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  state: LiveRoundState;
}

export interface ILiveMapPoint {
  guardId: string;
  guardName: string;
  clientName: string | null;
  roundId: string;
  routeTitle: string | null;
  latitude: number;
  longitude: number;
  timestamp: string;
  state: LiveRoundState;
}

export interface ILiveDashboard {
  generatedAt: string;
  scope: "ALL" | "CLIENT";
  kpis: {
    activeRounds: number;
    stalledRounds: number;
    guardsOnShift: number;
    openIncidents: number;
    pendingPanic: number;
    routesTotal: number;
    routesCovered: number;
    handoverCompliance: number | null;
    uniformCompliance: number | null;
  };
  alerts: ILiveAlert[];
  activeRounds: ILiveRound[];
  mapPoints: ILiveMapPoint[];
  uncoveredRoutes: { id: string; title: string; clientName: string | null }[];
  compliance: {
    handover: IAgendaSummary;
    uniform: IAgendaSummary;
    pending: IAgendaItem[];
  };
}
