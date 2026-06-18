import { post, put, remove, axiosInstance } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

export interface IDisciplineCategory {
  id: string;
  name: string;
  value: string;
  color?: string;
  icon?: string;
}

export interface IDisciplineType {
  id: string;
  categoryId: string;
  name: string;
  value: string;
  category?: IDisciplineCategory;
}

export interface IGuardDiscipline {
  id: string;
  guardId: string;
  title: string;
  description?: string | null;
  media?: { url: string; type: "photo" | "video" }[] | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  updatedAt: string;
  guard: { id: string; name: string; lastName: string | null; username: string };
  createdBy: { id: string; name: string; lastName: string | null; username: string };
  category?: { id: string; name: string; color?: string } | null;
  type?: { id: string; name: string } | null;
  client?: { id: string; name: string } | null;
}

// ── Categories ──
export const getPaginatedCategories = async (params: any) => {
  const res = await post<any>("/guard-discipline/categories/datatable", params);
  return { data: res.data?.rows || [], total: res.data?.total || 0 };
};

export const createCategory = async (data: Partial<IDisciplineCategory>): Promise<TResult<any>> =>
  post("/guard-discipline/categories", data);

export const updateCategory = async (id: string, data: Partial<IDisciplineCategory>): Promise<TResult<any>> =>
  put(`/guard-discipline/categories/${id}`, data);

export const deleteCategory = async (id: string): Promise<TResult<any>> =>
  remove(`/guard-discipline/categories/${id}`);

// ── Types ──
export const getPaginatedTypes = async (params: any) => {
  const res = await post<any>("/guard-discipline/types/datatable", params);
  return { data: res.data?.rows || [], total: res.data?.total || 0 };
};

export const createType = async (data: Partial<IDisciplineType>): Promise<TResult<any>> =>
  post("/guard-discipline/types", data);

export const updateType = async (id: string, data: Partial<IDisciplineType>): Promise<TResult<any>> =>
  put(`/guard-discipline/types/${id}`, data);

export const deleteType = async (id: string): Promise<TResult<any>> =>
  remove(`/guard-discipline/types/${id}`);

// ── Discipline Records ──
export const getPaginatedDisciplines = async (params: any) => {
  const res = await post<any>("/guard-discipline/datatable", params);
  if (res.success && res.data) {
    return { data: res.data.rows || [], total: res.data.total || 0 };
  }
  return { data: [], total: 0 };
};

export const createDiscipline = async (data: any): Promise<TResult<any>> =>
  post("/guard-discipline", data);

export const resolveDiscipline = async (id: string, data: { description?: string | null; status: "RESOLVED" | "DISMISSED" }): Promise<TResult<any>> =>
  put(`/guard-discipline/${id}/resolve`, data);

export const deleteDiscipline = async (id: string): Promise<TResult<any>> =>
  remove(`/guard-discipline/${id}`);

export const uploadDisciplineMedia = async (file: File): Promise<TResult<{ url: string; type: "photo" | "video" }>> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("location", "guard-discipline");

  try {
    const response = await axiosInstance.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const result = response.data;
    if (result.success) {
      return {
        success: true,
        data: { url: result.data.url, type: result.data.type === "VIDEO" ? "video" : "photo" },
        messages: [],
      };
    }
    return result;
  } catch (error: any) {
    return { success: false, data: null as any, messages: [error.message || "Error al subir archivo"] };
  }
};
