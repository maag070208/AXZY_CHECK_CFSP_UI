/**
 * Modelo de la entidad Configuración: catálogo de incidencias y parámetros
 * del sistema.
 *
 * ⚠️ Corrección de contrato (sexto caso de la misma familia): la WEB declaraba
 * `IncidentCategory.id` e `IncidentType.id` como `number`, pero en
 * `API/prisma/schema.prisma` son `String @id @default(uuid())`. El módulo viejo
 * arrastraba además `categoryId: number`.
 */
export type IncidentCategoryType = "INCIDENT" | "MAINTENANCE" | "DISCIPLINE";

export type IncidentCategory = {
  id: string;
  name: string;
  value: string;
  type: IncidentCategoryType;
  color?: string | null;
  icon?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type IncidentType = {
  id: string;
  categoryId: string;
  category?: { id: string; name: string } | null;
  name: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SysConfig = {
  /** `key` es la clave primaria del modelo, no un `id` aparte. */
  key: string;
  value: string;
  updatedAt?: string;
};

export type UpsertCategoryDto = {
  name: string;
  value: string;
  type: IncidentCategoryType;
  color?: string;
  icon?: string;
};

export type UpsertTypeDto = {
  categoryId: string;
  name: string;
  value: string;
};

/** Tono semántico por tipo de catálogo (no se usan colores crudos). */
export const CATEGORY_TYPE_META: Record<
  IncidentCategoryType,
  { label: string; badge: "danger" | "warning" | "purple" }
> = {
  INCIDENT: { label: "Incidencia", badge: "danger" },
  MAINTENANCE: { label: "Mantenimiento", badge: "warning" },
  DISCIPLINE: { label: "Disciplina", badge: "purple" },
};
