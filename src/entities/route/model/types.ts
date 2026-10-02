/**
 * Modelo de la entidad Ruta (recorrido recurrente de un cliente).
 *
 * Los ids de la API son UUID `String`; el módulo viejo usaba `number` en
 * `routeToDeleteId`, otro caso de la misma familia de errores de tipo.
 */
export type RouteTask = {
  id?: string;
  description: string;
  reqPhoto: boolean;
};

export type RouteLocation = {
  id?: string;
  locationId: string;
  order?: number;
  name?: string;
  /** La API embebe el nombre en `locationName`, no en `name`. */
  locationName?: string;
  /** Relación anidada que devuelve el backend en algunos endpoints. */
  location?: { id: string; name?: string; clientId?: string };
  tasks?: RouteTask[];
};

export type Route = {
  id: string;
  title: string;
  clientId: string;
  client?: { name: string } | null;
  guardId?: string | null;
  active: boolean;
  status?: string | null;
  tasks?: RouteTask[];
  locations?: RouteLocation[];
  /** Nombre que usa el backend para los puntos de control de una ruta. */
  recurringLocations?: RouteLocation[];
  guards?: { id: string; name: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreateRouteDto = {
  title: string;
  clientId: string;
  active?: boolean;
  tasks?: { description: string; reqPhoto: boolean }[];
  locations?: { locationId: string; order?: number }[];
};

/** Etiqueta y color por estado de la ruta. */
export const ROUTE_STATUS_META: Record<string, { label: string; badge: "success" | "warning" | "secondary" | "danger" }> = {
  ACTIVE: { label: "Activa", badge: "success" },
  PENDING: { label: "Pendiente", badge: "warning" },
  INACTIVE: { label: "Inactiva", badge: "secondary" },
  CANCELLED: { label: "Cancelada", badge: "danger" },
};
