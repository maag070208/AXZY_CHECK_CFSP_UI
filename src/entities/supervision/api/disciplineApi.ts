/**
 * API de disciplina de guardias. `request` de `@shared/api` nunca lanza.
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
import type { IDisciplineCategory, IDisciplineType, IGuardDiscipline } from "../model/discipline.types";

const BASE = "/guard-discipline";

/* ── Categorías ── */

export const fetchDisciplineCategoriesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IDisciplineCategory>> => {
  const res = await post<Paginated<IDisciplineCategory>>(`${BASE}/categories/datatable`, params);
  return toTableResponse<IDisciplineCategory>(res);
};

export const createDisciplineCategory = (
  data: Partial<IDisciplineCategory>,
): Promise<TResult<IDisciplineCategory>> => post<IDisciplineCategory>(`${BASE}/categories`, data);

export const updateDisciplineCategory = (
  id: string,
  data: Partial<IDisciplineCategory>,
): Promise<TResult<IDisciplineCategory>> => put<IDisciplineCategory>(`${BASE}/categories/${id}`, data);

export const deleteDisciplineCategory = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/categories/${id}`);

/* ── Tipos ── */

export const fetchDisciplineTypesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IDisciplineType>> => {
  const res = await post<Paginated<IDisciplineType>>(`${BASE}/types/datatable`, params);
  return toTableResponse<IDisciplineType>(res);
};

export const createDisciplineType = (data: Partial<IDisciplineType>): Promise<TResult<IDisciplineType>> =>
  post<IDisciplineType>(`${BASE}/types`, data);

export const updateDisciplineType = (
  id: string,
  data: Partial<IDisciplineType>,
): Promise<TResult<IDisciplineType>> => put<IDisciplineType>(`${BASE}/types/${id}`, data);

export const deleteDisciplineType = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/types/${id}`);

/* ── Registros ── */

export const fetchDisciplinesTable = async (
  params: ITDataTableFetchParams,
): Promise<ITDataTableResponse<IGuardDiscipline>> => {
  const res = await post<Paginated<IGuardDiscipline>>(`${BASE}/datatable`, params);
  return toTableResponse<IGuardDiscipline>(res);
};

export const createDiscipline = (data: unknown): Promise<TResult<IGuardDiscipline>> =>
  post<IGuardDiscipline>(BASE, data);

export const resolveDiscipline = (
  id: string,
  data: { description?: string | null; status: "RESOLVED" | "DISMISSED" },
): Promise<TResult<IGuardDiscipline>> => put<IGuardDiscipline>(`${BASE}/${id}/resolve`, data);

export const deleteDiscipline = (id: string): Promise<TResult<boolean>> =>
  remove<boolean>(`${BASE}/${id}`);

/**
 * Sube la evidencia de un registro. Va por `postForm` para no arrastrar el
 * axios legacy, que era el último sitio donde la vista hablaba HTTP directo.
 */
export const uploadDisciplineMedia = (file: File): Promise<TResult<{ url: string; type: "photo" | "video" }>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("location", "guard-discipline");

  return post<{ url: string; type: string }>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((res) =>
    res.success && res.data
      ? {
          success: true,
          data: { url: res.data.url, type: res.data.type === "VIDEO" ? ("video" as const) : ("photo" as const) },
          messages: res.messages,
        }
      : { success: false, data: { url: "", type: "photo" as const }, messages: res.messages },
  );
};
