/**
 * API de asignaciones. `request` de `@shared/api` nunca lanza.
 */
import {
  get,
  post,
  patch,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type { Assignment, AssignmentStatus, CreateAssignmentDTO } from "../model/types";

export const createAssignment = (data: CreateAssignmentDTO): Promise<TResult<Assignment>> =>
  post<Assignment>("/assignments", data);

/** Asignaciones activas de un guardia. */
export const getActiveAssignments = (guardId: string): Promise<TResult<Assignment[]>> =>
  get<Assignment[]>("/assignments", { params: { guardId } });

/** Historial completo (incluye cerradas) de un guardia. */
export const getAllAssignmentsByGuard = (guardId: string): Promise<TResult<Assignment[]>> =>
  get<Assignment[]>("/assignments/all", { params: { guardId } });

export const getAssignmentsByClient = (clientId: string): Promise<TResult<Assignment[]>> =>
  get<Assignment[]>("/assignments", { params: { clientId } });

export const updateAssignmentStatus = (
  id: string,
  status: AssignmentStatus,
): Promise<TResult<Assignment>> => patch<Assignment>(`/assignments/${id}/status`, { status });

export const deleteAssignment = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/assignments/${id}`);

export const fetchAssignmentsTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Assignment>> => {
  const res = await post<Paginated<Assignment>>("/assignments/datatable", params);
  return toTableResponse<Assignment>(res);
};
