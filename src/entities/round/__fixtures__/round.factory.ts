import { isoMinutesAgo, makeId } from "@shared/testing";
import type { Round } from "../model/types";

export const makeRound = (overrides: Partial<Round> = {}): Round => ({
  id: makeId("round"),
  guardId: makeId("guard"),
  clientId: makeId("client"),
  startTime: isoMinutesAgo(120),
  endTime: isoMinutesAgo(30),
  status: "COMPLETED",
  recurringConfigurationId: makeId("route"),
  recurringConfiguration: {
    id: makeId("route"),
    title: "Ronda nocturna",
    client: { id: makeId("client"), name: "Cliente Demo" },
    recurringLocations: [],
  },
  guard: { id: makeId("guard"), name: "Guardia", lastName: "Demo" },
  client: { id: makeId("client"), name: "Cliente Demo" },
  _count: { kardexEntries: 0 },
  ...overrides,
});
