import { get, post, put, remove, type TResult } from "@shared/api";
import type { Schedule } from "../model/types";

export const listSchedules = (): Promise<TResult<Schedule[]>> => get<Schedule[]>("/schedules");

export const createSchedule = (schedule: Partial<Schedule>): Promise<TResult<Schedule>> =>
  post<Schedule>("/schedules", schedule);

export const updateSchedule = (id: string, schedule: Partial<Schedule>): Promise<TResult<Schedule>> =>
  put<Schedule>(`/schedules/${id}`, schedule);

export const deleteSchedule = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/schedules/${id}`);

/** Usuarios asignados a un horario. */
export const getUsersBySchedule = async (id: string): Promise<unknown[]> => {
  const res = await get<unknown[]>(`/schedules/${id}/users`);
  return res.data ?? [];
};
