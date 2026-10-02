/**
 * Modelo de la entidad Zona (agrupación de ubicaciones de un cliente).
 */
export type Zone = {
  id: string;
  clientId: string;
  name: string;
  active: boolean;
};

export type CreateZoneDto = {
  clientId: string;
  name: string;
};

export type UpdateZoneDto = {
  name?: string;
  active?: boolean;
};
