/**
 * Modelo de la entidad Usuario.
 *
 * Nota FSD: este slice NO importa de `entities/schedule`. Los slices del mismo
 * layer tienen prohibido importarse entre sí, así que la parte del horario que
 * la UI necesita se declara aquí (`UserScheduleRef`). Si se necesita el
 * catálogo de horarios, lo consumen las páginas desde `@entities/schedule`.
 */

/** Referencia mínima al horario asignado, tal como la devuelve la API. */
export type UserScheduleRef = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  active?: boolean;
};

export type UserRoleRef = {
  id: string;
  name: string;
  value: string;
};

/** Registro de asignación/baja de un usuario (bitácora). */
export type UserAssignmentLog = {
  id: string;
  /** "ASIGNADO" | "BAJA" | … */
  type: string;
  notes?: string | null;
  createdAt?: string;
};

export type User = {
  id: string;
  name: string;
  lastName: string;
  username: string;
  roleId: string;
  role: UserRoleRef;
  active: boolean;
  /** "HH:mm" */
  shiftStart?: string | null;
  /** "HH:mm" */
  shiftEnd?: string | null;
  isLoggedIn?: boolean;
  assignmentLogs?: UserAssignmentLog[];
  assignments?: unknown[];
  schedule?: UserScheduleRef | null;
  scheduleId?: string | null;
  clientId?: string | null;
  client?: { id: string; name: string; active: boolean } | null;
};

export type CreateUserDto = {
  name: string;
  lastName: string;
  username: string;
  password?: string;
  roleId: string;
  shiftStart?: string;
  shiftEnd?: string;
  scheduleId?: string;
  clientId?: string;
};

export type UpdateUserDto = {
  name?: string;
  lastName?: string;
  username?: string;
  roleId?: string;
  shiftStart?: string;
  shiftEnd?: string;
  scheduleId?: string;
  /** `null` desasigna al guardia del cliente. */
  clientId?: string | null;
  active?: boolean;
};

export type ChangePasswordDto = {
  oldPassword?: string;
  newPassword: string;
};

/** "Juan Pérez" */
export const userName = (user: Pick<User, "name" | "lastName">): string =>
  `${user.name} ${user.lastName ?? ""}`.trim();

/** Iniciales para el avatar: "JP". */
export const userInitials = (user: Pick<User, "name" | "lastName">): string =>
  `${user.name?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

/** Etiqueta y badge por rol. Interno: se consume vía `roleLabel`/`roleBadge`. */
const ROLE_META: Record<string, { label: string; badge: "primary" | "warning" | "info" | "secondary" | "purple" }> = {
  ADMIN: { label: "Administrador", badge: "primary" },
  LIDER: { label: "Líder", badge: "purple" },
  SHIFT: { label: "Jefe de turno", badge: "warning" },
  GUARD: { label: "Guardia", badge: "info" },
  MAINT: { label: "Mantenimiento", badge: "secondary" },
  RESDN: { label: "Cliente", badge: "secondary" },
};

export const roleLabel = (roleName?: string): string =>
  (roleName && ROLE_META[roleName]?.label) || roleName || "Sin rol";

export const roleBadge = (roleName?: string): "primary" | "warning" | "info" | "secondary" | "purple" =>
  (roleName && ROLE_META[roleName]?.badge) || "secondary";
