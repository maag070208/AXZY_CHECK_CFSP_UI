/**
 * API de rondas. `request` de `@shared/api` nunca lanza.
 */
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
import type { Round, RoundDetail } from "../model/types";

/** Listado de rondas, opcionalmente acotado por fecha y/o guardia. */
export const listRounds = (filters: { date?: string; guardId?: string } = {}): Promise<TResult<Round[]>> =>
  get<Round[]>("/rounds", { params: filters });

export const getRoundById = (id: string): Promise<TResult<RoundDetail>> =>
  get<RoundDetail>(`/rounds/${id}`);

export const fetchRoundsTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<Round>> => {
  const res = await post<Paginated<Round>>("/rounds/datatable", params);
  return toTableResponse<Round>(res);
};

export const startRound = (guardId: string): Promise<TResult<Round>> =>
  post<Round>("/rounds/start", { guardId });

export const endRound = (id: string): Promise<TResult<Round>> => put<Round>(`/rounds/${id}/end`, {});

export const deleteRound = (id: string): Promise<TResult<boolean>> => remove<boolean>(`/rounds/${id}`);

export const getCurrentRound = (): Promise<TResult<Round>> => get<Round>("/rounds/current");
