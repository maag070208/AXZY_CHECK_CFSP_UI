/**
 * Modelo de la entidad Mantenimiento.
 *
 * ⚠️ Corrección de contrato: la WEB declaraba `id: number` para
 * `Maintenance`, `guard`, `resolvedBy` y `categoryRel`, pero en el schema de
 * Prisma (`API/prisma/schema.prisma`) **todos los ids son
 * `String @id @default(uuid())`**. El error estaba tapado con
 * `resolveMaintenance(id as any)` y `deleteMaintenance(id as any)`. Aquí se
 * tipan como `string`, que es lo que devuelve la API.
 *
 * Nota FSD: este slice NO importa de `entities/incident`. Los slices del mismo
 * layer tienen prohibido importarse entre sí, así que la referencia a
 * categoría se declara aquí. Cuando haga falta el catálogo compartido, será
 * `entities/incident-category` y lo consumirán features y páginas (que sí
 * pueden importar de `entities`), nunca otra entidad.
 */

export type MaintenanceStatus = "PENDING" | "ATTENDED";

/** Referencia mínima a la categoría (`IncidentCategory` en la API). */
export type MaintenanceCategoryRef = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
};

export type MaintenanceMedia = {
  type: "IMAGE" | "VIDEO";
  url: string;
  key?: string;
};

export type MaintenancePerson = {
  id: string;
  name: string;
  lastName?: string | null;
  username?: string;
};

export type Maintenance = {
  id: string;
  title: string;
  description: string;
  /** Nombre de categoría "plano" que devuelve el backend. */
  category: string | null;
  status: MaintenanceStatus;
  createdAt: string;
  resolvedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  media?: MaintenanceMedia[] | null;
  guard?: MaintenancePerson | null;
  resolvedBy?: MaintenancePerson | null;
  /**
   * Relación con la categoría. En el modelo de Prisma la relación se llama
   * `categoryRel` (ver `FANSAL_RULES.txt` §6), no `category`.
   */
  categoryRel?: MaintenanceCategoryRef | null;
  client?: { id?: string; name: string } | null;
};

export type CreateMaintenanceDto = {
  title: string;
  category: string;
  description: string;
  media: string[];
};

export type MaintenanceListParams = {
  startDate?: Date;
  endDate?: Date;
  guardId?: string;
  category?: string;
  search?: string;
  [key: string]: unknown;
};

export const MAINTENANCE_STATUS_META: Record<
  MaintenanceStatus,
  { label: string; badge: "danger" | "success" }
> = {
  PENDING: { label: "Pendiente", badge: "danger" },
  ATTENDED: { label: "Atendida", badge: "success" },
};
