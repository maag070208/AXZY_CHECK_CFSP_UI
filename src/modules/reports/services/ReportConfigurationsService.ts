import { post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface DatatableResponse<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

export const getPaginatedReportConfigurations = async (
  params: any,
): Promise<TResult<DatatableResponse<any>>> => {
  return await post<DatatableResponse<any>>(
    "/report-configurations/datatable",
    params,
  );
};

export const createReportConfiguration = async (
  data: any,
): Promise<TResult<any>> => {
  return await post<any>("/report-configurations", data);
};

export const updateReportConfiguration = async (
  id: string,
  data: any,
): Promise<TResult<any>> => {
  return await put<any>(`/report-configurations/${id}`, data);
};

export const deleteReportConfiguration = async (
  id: string,
): Promise<TResult<any>> => {
  return await remove<any>(`/report-configurations/${id}`);
};
