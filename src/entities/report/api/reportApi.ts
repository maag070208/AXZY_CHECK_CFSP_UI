/**
 * API de reportes. `request` de `@shared/api` nunca lanza.
 */
import {
  get,
  post,
  put,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type {
  IIncidentReport,
  IIncidentReportParams,
  ReportConfiguration,
  IGuardDetail,
  IGuardDetailBreakdown,
  IGuardReportFilters,
  IGuardStats,
  IGuardWorkload,
  ITopPerformance,
} from "../model/types";

const BASE = "/reports/guards";

export const getGuardStats = (filters: IGuardReportFilters): Promise<TResult<IGuardStats>> =>
  get<IGuardStats>(`${BASE}/stats`, { params: filters });

export const getTopPerformance = (filters: IGuardReportFilters): Promise<TResult<ITopPerformance[]>> =>
  get<ITopPerformance[]>(`${BASE}/top-performance`, { params: filters });

export const getDistribution = (filters: IGuardReportFilters): Promise<TResult<IGuardStats>> =>
  get<IGuardStats>(`${BASE}/distribution`, { params: filters });

export const getDetailedReport = (filters: IGuardReportFilters): Promise<TResult<IGuardDetail[]>> =>
  get<IGuardDetail[]>(`${BASE}/detail`, { params: filters });

/** `guardId` es UUID, no número. */
export const getGuardDetailBreakdown = (
  guardId: string,
  filters: IGuardReportFilters,
): Promise<TResult<IGuardDetailBreakdown>> =>
  get<IGuardDetailBreakdown>(`${BASE}/detail-breakdown/${guardId}`, { params: filters });

export const getWorkloadComparison = (filters: IGuardReportFilters): Promise<TResult<IGuardWorkload[]>> =>
  get<IGuardWorkload[]>(`${BASE}/workload`, { params: filters });

/* ── Incidencias y PDF ── */

export const getIncidentReport = (
  params: IIncidentReportParams,
): Promise<TResult<IIncidentReport>> =>
  get<IIncidentReport>("/reports/incidents/summary", { params });

/**
 * Genera el PDF de la matriz administrativa y lo abre.
 *
 * Antes se llamaba a `post` con `responseType: blob` desde la vista; ahora la
 * vista recibe un booleano y el manejo del `Blob` queda encapsulado aquí.
 */
export const generateAdministrativeMatrixPdf = async (
  params: Record<string, unknown> & { fileName?: string },
): Promise<TResult<boolean>> => {
  const { fileName, ...body } = params;

  const res = await post<Blob>("/reports/administrative/matrix/pdf", body, {
    responseType: "blob",
  });

  if (!res.success || !res.data) {
    return { success: false, data: false, messages: res.messages };
  }

  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));

  // Con nombre de archivo se descarga; sin él, se abre en una pestaña.
  if (fileName) {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(url, "_blank");
  }

  return { success: true, data: true, messages: ["PDF generado"] };
};

/* ── Configuraciones de reporte ── */

export const fetchReportConfigurationsTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<ReportConfiguration>> => {
  const res = await post<Paginated<ReportConfiguration>>("/report-configurations/datatable", params);
  return toTableResponse<ReportConfiguration>(res);
};

export const createReportConfiguration = (
  data: Record<string, unknown>,
): Promise<TResult<ReportConfiguration>> => post<ReportConfiguration>("/report-configurations", data);

export const updateReportConfiguration = (
  id: string,
  data: Record<string, unknown>,
): Promise<TResult<ReportConfiguration>> =>
  put<ReportConfiguration>(`/report-configurations/${id}`, data);

export const deleteReportConfiguration = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/report-configurations/${id}`);
