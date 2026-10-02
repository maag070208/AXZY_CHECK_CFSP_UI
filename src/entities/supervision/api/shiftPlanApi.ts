/**
 * API de planes de turno. `request` de `@shared/api` nunca lanza.
 *
 * Endpoints verificados contra `API/src/modules/shift-plans/shift-plan.routes.ts`.
 * Las URLs concatenaban los query strings a mano; ahora van por `params`, que
 * además omite las claves vacías.
 */
import { get, post, put, remove, type TResult } from "@shared/api";
import type { IAgenda, IShiftPlan, IShiftPlanCreate, IShiftPlanUpdate } from "../model/types";

const BASE = "/shift-plans";

export const getShiftPlans = (clientId?: string): Promise<TResult<IShiftPlan[]>> =>
  get<IShiftPlan[]>(BASE, clientId ? { params: { clientId } } : undefined);

export const createShiftPlan = (data: IShiftPlanCreate): Promise<TResult<IShiftPlan>> =>
  post<IShiftPlan>(BASE, data);

export const updateShiftPlan = (id: string, data: IShiftPlanUpdate): Promise<TResult<IShiftPlan>> =>
  put<IShiftPlan>(`${BASE}/${id}`, data);

export const deleteShiftPlan = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/${id}`);

/** Agenda de una fecha concreta (por defecto, hoy según el backend). */
export const getAgenda = (date: string, clientId?: string): Promise<TResult<IAgenda>> =>
  get<IAgenda>(`${BASE}/agenda`, { params: { date, ...(clientId ? { clientId } : {}) } });

/** Agenda del turno en curso. */
export const getCurrentAgenda = (clientId?: string): Promise<TResult<IAgenda>> =>
  get<IAgenda>(`${BASE}/agenda/current`, clientId ? { params: { clientId } } : undefined);
