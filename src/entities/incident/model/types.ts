/**
 * Modelo de la entidad Incidencia.
 *
 * Vive en `entities/incident` (FSD): es el vocabulario compartido por las
 * features y páginas que trabajan con incidencias. No conoce React ni axios.
 */

export type IncidentStatus = "PENDING" | "ATTENDED";

export type IncidentPerson = {
  id: string;
  name: string;
  lastName?: string | null;
  username?: string;
};

export type IncidentCategoryRef = {
  id: string;
  name: string;
  /** Nombre de icono de MaterialCommunityIcons (APP) / react-icons (WEB). */
  icon?: string | null;
  /** Color hex de la categoría. */
  color?: string | null;
};

export type Incident = {
  id: string;
  guardId: string;
  title: string;
  categoryId: string;
  typeId: string;
  description: string;
  media: string[];
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  status: IncidentStatus;
  clientId: string;
  guard: IncidentPerson;
  resolvedBy?: IncidentPerson | null;
  category: IncidentCategoryRef;
  type: { id: string; name: string };
  client: { id: string; name: string };
};

/** Payload de creación. `media` son las llaves ya subidas. */
export type CreateIncidentDto = {
  title: string;
  categoryId: string;
  typeId: string;
  description: string;
  media: string[];
};

/** Filtros del listado (los que entiende el backend). */
export type IncidentListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: IncidentStatus | "ALL";
  startDate?: Date;
  endDate?: Date;
  guardId?: string;
  category?: string;
  [key: string]: unknown;
};

/**
 * Etiqueta y color de cada estado. Los colores son *semánticos*
 * (`danger`/`success`), no de la paleta cruda: así siguen el tema.
 */
export const INCIDENT_STATUS_META: Record<
  IncidentStatus,
  { label: string; badge: "danger" | "success" }
> = {
  PENDING: { label: "Pendiente", badge: "danger" },
  ATTENDED: { label: "Atendida", badge: "success" },
};

/** ¿La incidencia sigue abierta? */
export const isPending = (incident: Pick<Incident, "status">): boolean =>
  incident.status === "PENDING";
