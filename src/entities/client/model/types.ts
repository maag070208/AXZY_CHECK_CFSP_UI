/**
 * Modelo de la entidad Cliente.
 *
 * Los ids de la API son UUID `String` (Prisma `@default(uuid())`); el módulo
 * viejo aceptaba `string | number` en todas sus firmas.
 */
export type Client = {
  id: string;
  name: string;
  address?: string | null;
  rfc?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  active: boolean;
  softDelete: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  locations?: ClientLocationRef[];
  users?: ClientUserRef[];
  zones?: ClientZoneRef[];
};

/** Referencias embebidas: se declaran aquí para no importar de otra entidad. */
export type ClientLocationRef = { id: string; name: string };
export type ClientZoneRef = { id: string; name: string };
export type ClientUserRef = { id: string; name: string; lastName?: string | null };

export type ClientCreate = {
  name: string;
  address?: string;
  rfc?: string;
  contactName?: string;
  contactPhone?: string;
  active?: boolean;
  appUsername?: string;
  appPassword?: string;
};

export type ClientUpdate = Partial<ClientCreate> & { softDelete?: boolean };

/** Teléfono a 10 dígitos, sólo números (regla 14 del estándar). */
export const CLIENT_PHONE_REGEX = /^[0-9]{10}$/;

/** Dirección corta para listados: "Calle 123, Colonia". */
export const clientAddress = (client: Pick<Client, "address">): string =>
  client.address?.trim() || "Sin dirección";
