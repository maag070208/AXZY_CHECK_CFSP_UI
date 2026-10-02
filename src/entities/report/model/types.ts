/**
 * Modelo de la entidad Reporte (analítica de guardias).
 *
 * Endpoints verificados contra `API/src/modules/reports/report.routes.ts`.
 */
export interface IGuardReportFilters {
    startDate: string;
    endDate: string;
    /** UUID: en Prisma es `String @id @default(uuid())`, no un número. */
    guardId?: string;
}

export interface IGuardStats {
    totalIncidents: number;
    totalScans: number;
    incompleteRounds: number;
    missedScans: number;
}

export interface ITopPerformance {
    guardId: number;
    name: string;
    lastName: string;
    totalScans: number;
}

export interface IGuardWorkload {
    guardId: number;
    name: string;
    lastName: string;
    role: string;
    workload: number;
    details: {
        scans: number;
        reports: number;
        rounds: number;
    }
}

export interface IGuardDetail {
    guardId: number;
    name: string;
    lastName: string;
    role: string;
    totalRounds: number;
    totalScans: number;
    incompleteRounds: number;
    missedScans: number;
    avgRoundTimeMinutes: number;
}

export interface IMissedPoint {
    roundId: number;
    startTime: string;
    locationId: number;
    locationName: string;
    aisle: string;
}

export interface IIncompleteRound {
    roundId: number;
    startTime: string;
    endTime: string;
    missedCount: number;
    totalLocations: number;
}

export interface IGuardDetailBreakdown {
    missedPoints: IMissedPoint[];
    incompleteRounds: IIncompleteRound[];
}

export interface IIncidentReportParams {
  startDate: string;
  endDate: string;
  clientId?: string;
}

export interface IIncidentReportBreakdownItem {
  id: string;
  name: string;
  color?: string | null;
  count: number;
}

export interface IIncidentReport {
  total: number;
  pending: number;
  attended: number;
  resolutionRate: number;
  byCategory: IIncidentReportBreakdownItem[];
  byGuard: IIncidentReportBreakdownItem[];
  byDay: Array<{ date: string; count: number }>;
}



/** Rango y rutas de una configuración de reporte programado. */
export type ReportConfiguration = {
  startDate?: string;
  endDate?: string;
  recurringConfigurationIds?: string[];
  [key: string]: unknown;
};

/** Fila de la tabla de configuraciones de reporte. */
export type ReportConfigRow = {
  id: string;
  name: string;
  reportType: string;
  /** La configuración guarda el cliente en la raíz y anidado en `client`. */
  clientId?: string | null;
  client?: { id: string; name: string } | null;
  configuration: ReportConfiguration;
  createdAt?: string;
};
