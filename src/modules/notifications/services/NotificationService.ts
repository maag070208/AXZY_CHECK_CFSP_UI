import { post, put, remove } from "@app/core/axios/axios";

export interface ScheduledNotification {
  id: string;
  title?: string;
  message: string;
  type: string;
  persistent: boolean;
  channel: string;
  userId?: string;
  frequency: string;
  timeOfDay?: string;
  scheduledAt?: string;
  active: boolean;
  sendCount: number;
  lastSentAt?: string;
  nextSendAt?: string;
  createdAt: string;
  targetUser?: { id: string; name: string; lastName: string };
}

export const getPaginated = async (params: any) => {
  const res = await post<any>("/scheduled-notifications/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};

export const createScheduled = async (data: any) => {
  return await post<ScheduledNotification>("/scheduled-notifications", data);
};

export const updateScheduled = async (id: string, data: any) => {
  return await put<ScheduledNotification>(`/scheduled-notifications/${id}`, data);
};

export const deleteScheduled = async (id: string) => {
  return await remove(`/scheduled-notifications/${id}`);
};
