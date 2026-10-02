/**
 * Dependencias del view-model de horarios.
 */
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createSchedule,
  deleteSchedule,
  fetchSchedulesTable,
  getUsersBySchedule,
  updateSchedule,
  type Schedule,
} from "@entities/schedule";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

/** Usuario asignado a un horario (subconjunto que devuelve la API). */
export type ScheduleUserRef = {
  id: string;
  name: string;
  lastName?: string | null;
  username?: string;
  active?: boolean;
};

export interface SchedulesDeps {
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<Schedule>>;
  create: (data: Partial<Schedule>) => Promise<TResult<Schedule>>;
  update: (id: string, data: Partial<Schedule>) => Promise<TResult<Schedule>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  listUsers: (id: string) => Promise<TResult<ScheduleUserRef[]>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useSchedulesDeps = (): SchedulesDeps => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      fetchTable: fetchSchedulesTable,
      create: createSchedule,
      update: updateSchedule,
      remove: deleteSchedule,
      listUsers: getUsersBySchedule,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [dispatch],
  );
};
