/**
 * API de notificaciones programadas. `request` de `@shared/api` nunca lanza.
 *
 * Incluye `sendNotificationNow`, que antes se llamaba con un `post` directo a
 * axios desde la página (saltándose la capa de servicios).
 */
import {
  post,
  put,
  remove,
  toTableResponse,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
  type Paginated,
  type TResult,
} from "@shared/api";
import type { NotificationForm, ScheduledNotification } from "../model/types";

export const fetchScheduledTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<ScheduledNotification>> => {
  const res = await post<Paginated<ScheduledNotification>>("/scheduled-notifications/datatable", params);
  return toTableResponse<ScheduledNotification>(res);
};

export const createScheduled = (data: unknown): Promise<TResult<ScheduledNotification>> =>
  post<ScheduledNotification>("/scheduled-notifications", data);

export const updateScheduled = (id: string, data: unknown): Promise<TResult<ScheduledNotification>> =>
  put<ScheduledNotification>(`/scheduled-notifications/${id}`, data);

export const deleteScheduled = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`/scheduled-notifications/${id}`);

/** Envía la notificación ahora mismo, sin esperar a su programación. */
export const sendNotificationNow = (
  row: Pick<ScheduledNotification, "title" | "message" | "type" | "channel" | "userId" | "persistent">,
): Promise<TResult<unknown>> =>
  post<unknown>("/notifications/send", {
    title: row.title,
    message: row.message,
    type: row.type,
    channel: row.channel || "global",
    userId: row.userId || undefined,
    persistent: row.persistent,
  });

export type { NotificationForm };
