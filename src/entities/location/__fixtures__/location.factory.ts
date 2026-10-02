import { makeId } from "@shared/testing";
import type { Location } from "../model/types";

export const makeLocation = (overrides: Partial<Location> = {}): Location => ({
  id: makeId("location"),
  clientId: makeId("client"),
  zoneId: makeId("zone"),
  client: { name: "Cliente Demo" },
  zone: { name: "Zona Norte" },
  clientName: "Cliente Demo",
  name: "Acceso Principal",
  reference: null,
  aisle: "A",
  spot: "1",
  number: "01",
  isOccupied: false,
  entries: [],
  ...overrides,
});
