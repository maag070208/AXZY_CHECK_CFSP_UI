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
import type { Schedule } from "../model/types";

/** Usuario asignado a un horario (subconjunto que devuelve la API). */
export type ScheduleUserRef = {
  id: string;
  name: string;
  lastName?: string | null;
  username?: string;
  active?: boolean;
};

export const listSchedules = (): Promise<TResult<Schedule[]>> => get<Schedule[]>("/schedules");

export const createSchedule = (schedule: Partial<Schedule>): Promise<TResult<Schedule>> =>
  post<Schedule>("/schedules", schedule);

export const updateSchedule = (id: string, schedule: Partial<Schedule>): Promise<TResult<Schedule>> =>
  put<Schedule>(`/schedules/${id}`, schedule);

export const deleteSchedule = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/schedules/${id}`);

/** Usuarios asignados a un horario. */
export const getUsersBySchedule = (id: string): Promise<TResult<ScheduleUserRef[]>> =>
  get<ScheduleUserRef[]>(`/schedules/${id}/users`);

export const fetchSchedulesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Schedule>> => {
  const res = await post<Paginated<Schedule>>("/schedules/datatable", params);
  return toTableResponse<Schedule>(res);
};
