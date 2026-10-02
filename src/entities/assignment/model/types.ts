/**
 * Modelo de la entidad Asignación (tarea de un guardia en una ubicación).
 *
 * ⚠️ Corrección de contrato: la WEB declaraba `id`, `guardId`, `locationId` y
 * `assignedBy` como `number`, pero en `API/prisma/schema.prisma` los cuatro son
 * `String @id @default(uuid())`. Es el cuarto caso de la misma familia
 * (mantenimiento, usuario y categorías también estaban mal) y estaba tapado
 * con casts `as any` en los modales.
 */
/** Referencia mínima al guardia asignado (la API embebe sólo estos campos). */
export type AssignmentGuardRef = {
  id: string;
  name: string;
  lastName?: string | null;
  username?: string;
  active?: boolean;
};

/**
 * Objeto-constante en lugar de `enum`: mantiene `AssignmentStatus.PENDING`
 * como valor (lo usan los modales) y sigue siendo un tipo unión utilizable.
 */
export const AssignmentStatus = {
  PENDING: "PENDING",
  CHECKING: "CHECKING",
  UNDER_REVIEW: "UNDER_REVIEW",
  REVIEWED: "REVIEWED",
  COMPLETED: "COMPLETED",
  ANOMALY: "ANOMALY",
  CANCELLED: "CANCELLED",
  ACTIVE: "ACTIVE",
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export type AssignmentTask = {
  id?: string;
  description: string;
  reqPhoto: boolean;
  completed: boolean;
  completedAt?: string | null;
};

/** Ubicación embebida en la asignación (subconjunto que devuelve la API). */
export type AssignmentLocationRef = {
  id: string;
  name: string;
  aisle?: string | null;
  spot?: string | null;
  number?: string | null;
};

export type Assignment = {
  id: string;
  guardId: string;
  locationId: string;
  assignedBy: string;
  notes?: string | null;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
  location: AssignmentLocationRef;
  guard: AssignmentGuardRef;
  tasks: AssignmentTask[];
  kardex?: unknown[];
};

export type CreateAssignmentDTO = {
  guardId: string;
  locationId: string;
  assignedBy: string;
  notes?: string;
  tasks?: { description: string; reqPhoto: boolean }[];
};

/** Etiqueta y color de badge por estado de la asignación. */
export const ASSIGNMENT_STATUS_META: Record<
  AssignmentStatus,
  { label: string; badge: "secondary" | "info" | "warning" | "success" | "danger" | "purple" }
> = {
  PENDING: { label: "Pendiente", badge: "warning" },
  CHECKING: { label: "En revisión", badge: "info" },
  UNDER_REVIEW: { label: "En revisión", badge: "info" },
  REVIEWED: { label: "Revisada", badge: "purple" },
  COMPLETED: { label: "Completada", badge: "success" },
  ANOMALY: { label: "Anomalía", badge: "danger" },
  CANCELLED: { label: "Cancelada", badge: "secondary" },
  ACTIVE: { label: "Activa", badge: "success" },
};

/** Progreso de tareas: "2/5". */
export const assignmentTaskProgress = (assignment: Pick<Assignment, "tasks">): string => {
  const total = assignment.tasks?.length ?? 0;
  const done = assignment.tasks?.filter((t) => t.completed).length ?? 0;
  return `${done}/${total}`;
};

/** ¿Tiene tareas con foto obligatoria pendientes? */
export const assignmentNeedsPhoto = (assignment: Pick<Assignment, "tasks">): boolean =>
  (assignment.tasks ?? []).some((t) => t.reqPhoto && !t.completed);
