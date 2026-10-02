import { makeId } from "@shared/testing";
import type { Zone } from "../model/types";

export const makeZone = (overrides: Partial<Zone> = {}): Zone => ({
  id: makeId("zone"),
  clientId: makeId("client"),
  name: "Zona Norte",
  active: true,
  ...overrides,
});
