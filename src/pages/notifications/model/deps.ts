/**
 * Dependencias del view-model de notificaciones programadas.
 */
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createScheduled,
  deleteScheduled,
  fetchScheduledTable,
  sendNotificationNow,
  updateScheduled,
  type ScheduledNotification,
} from "@entities/scheduled-notification";
import type { ITDataTableFetchParams, ITDataTableResponse, TResult } from "@shared/api";

export interface NotificationsDeps {
  fetchTable: (params: ITDataTableFetchParams) => Promise<ITDataTableResponse<ScheduledNotification>>;
  create: (data: unknown) => Promise<TResult<ScheduledNotification>>;
  update: (id: string, data: unknown) => Promise<TResult<ScheduledNotification>>;
  remove: (id: string) => Promise<TResult<boolean>>;
  sendNow: (row: ScheduledNotification) => Promise<TResult<unknown>>;
  notify: (message: string, type: "success" | "error") => void;
}

export const useNotificationsDeps = (): NotificationsDeps => {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      fetchTable: fetchScheduledTable,
      create: createScheduled,
      update: updateScheduled,
      remove: deleteScheduled,
      sendNow: sendNotificationNow,
      notify: (message, type) => dispatch(showToast({ message, type })),
    }),
    [dispatch],
  );
};
