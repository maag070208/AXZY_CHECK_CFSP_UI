import { get, post, put, remove } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";
import { IAgenda, IShiftPlan, IShiftPlanCreate, IShiftPlanUpdate } from "@app/core/types/supervision.types";

const clientQuery = (clientId?: string) => (clientId ? `clientId=${encodeURIComponent(clientId)}` : "");

export const getShiftPlans = (clientId?: string): Promise<TResult<IShiftPlan[]>> =>
  get<IShiftPlan[]>(`/shift-plans?${clientQuery(clientId)}`);

export const createShiftPlan = (data: IShiftPlanCreate): Promise<TResult<IShiftPlan>> =>
  post<IShiftPlan>("/shift-plans", data);

export const updateShiftPlan = (id: string, data: IShiftPlanUpdate): Promise<TResult<IShiftPlan>> =>
  put<IShiftPlan>(`/shift-plans/${id}`, data);

export const deleteShiftPlan = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/shift-plans/${id}`);

/** Agenda de un día (YYYY-MM-DD). */
export const getAgenda = (date: string, clientId?: string): Promise<TResult<IAgenda>> =>
  get<IAgenda>(`/shift-plans/agenda?date=${date}&${clientQuery(clientId)}`);

/** Compromisos vigentes: turnos de hoy y nocturnos de ayer aún en curso. */
export const getCurrentAgenda = (clientId?: string): Promise<TResult<IAgenda>> =>
  get<IAgenda>(`/shift-plans/agenda/current?${clientQuery(clientId)}`);
