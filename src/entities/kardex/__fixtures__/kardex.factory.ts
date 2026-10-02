import { isoMinutesAgo, makeId } from "@shared/testing";
import type { KardexEntry } from "../model/types";

export const makeKardexEntry = (overrides: Partial<KardexEntry> = {}): KardexEntry => ({
  id: makeId("kardex"),
  userId: makeId("user"),
  locationId: makeId("location"),
  timestamp: isoMinutesAgo(30),
  media: [],
  latitude: null,
  longitude: null,
  scanType: "RECURRING",
  assignmentId: null,
  user: { id: makeId("user"), name: "Guardia", lastName: "Demo", username: "guardia.demo", role: "GUARD" },
  location: { id: makeId("location"), name: "Acceso Principal", aisle: "A", spot: "1", number: "01" },
  assignment: null,
  ...overrides,
});
