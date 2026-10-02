import { get, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export const getRecurringConfigurationsList = async () => {
  return get(`/recurring`);
};

export const generateAdministrativeMatrixPDF = async (params: {
  recurringConfigurationIds: string[];
  startDate: string;
  endDate: string;
}) => {
  return post(`/reports/administrative/matrix/pdf`, params, {
    responseType: "blob",
  });
};

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

export const getIncidentReport = async (
  params: IIncidentReportParams,
): Promise<TResult<IIncidentReport>> => {
  return get<IIncidentReport>(`/reports/incidents/summary`, { params });
};
