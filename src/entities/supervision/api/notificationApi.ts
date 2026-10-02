/**
 * API de notificaciones. `request` de `@shared/api` nunca lanza.
 */
import { post, type TResult } from "@shared/api";

export type SendNotificationDto = {
  title?: string;
  message: string;
  type: string;
  userId?: string;
  /** `global` envía a todos; de lo contrario va al `userId`. */
  channel: "global" | "user";
  persistent: boolean;
};

export const sendNotification = (data: SendNotificationDto): Promise<TResult<boolean>> =>
  post<boolean>("/notifications/send", data);
