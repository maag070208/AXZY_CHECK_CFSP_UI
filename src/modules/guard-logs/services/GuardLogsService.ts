import { patch, post, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface IGuardLoginLog {
  id: string;
  userId: string;
  loginAt: string;
  logoutAt: string | null;
  user: {
    id: string;
    name: string;
    lastName: string | null;
    username: string;
  };
}

export const clockIn = async (guardId: string): Promise<TResult<IGuardLoginLog>> => {
  return await post<IGuardLoginLog>("/guard-logs/clock-in", { guardId });
};

export const clockOut = async (guardId: string): Promise<TResult<IGuardLoginLog>> => {
  return await patch<IGuardLoginLog>("/guard-logs/clock-out", { guardId });
};

export const deleteGuardLog = async (id: string): Promise<TResult<any>> => {
  return await remove<any>(`/guard-logs/${id}`);
};

export const getPaginatedGuardLogs = async (params: any) => {
  const res = await post<any>("/guard-logs/datatable", params);
  if (res.success && res.data) {
    return {
      data: res.data.rows || [],
      total: res.data.total || 0,
    };
  }
  return { data: [], total: 0 };
};
