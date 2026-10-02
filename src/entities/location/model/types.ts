/**
 * Modelo de la entidad Ubicación (punto de control de un cliente).
 *
 * Necesaria antes que `guards` y `clients`: ambas la consumen, y en FSD una
 * entidad no puede importar el servicio de un módulo.
 */
export type Location = {
  id: string;
  clientId?: string | null;
  zoneId?: string | null;
  client?: { name: string } | null;
  zone?: { name: string } | null;
  clientName?: string | null;
  name: string;
  reference?: string | null;
  aisle?: string | null;
  spot?: string | null;
  number?: string | null;
  isOccupied: boolean;
  entries?: unknown[];
  _count?: { tasks: number };
};

export type CreateLocationDto = {
  name: string;
  clientId: string;
  zoneId?: string;
  reference?: string;
  aisle?: string;
  spot?: string;
  number?: string;
};

/** "A · 1 · 01" — referencia legible de un punto de control. */
export const locationCode = (location: Pick<Location, "aisle" | "spot" | "number">): string =>
  [location.aisle, location.spot, location.number].filter(Boolean).join(" · ");

/** Nombre con su cliente, para listados y selects. */
export const locationLabel = (location: Pick<Location, "name" | "clientName">): string =>
  location.clientName ? `${location.name} — ${location.clientName}` : location.name;
