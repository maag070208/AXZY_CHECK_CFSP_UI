import { isoMinutesAgo, makeId } from "@shared/testing";
import type { Assignment } from "../model/types";

export const makeAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: makeId("assignment"),
  guardId: makeId("guard"),
  locationId: makeId("location"),
  assignedBy: makeId("user"),
  notes: null,
  status: "PENDING",
  createdAt: isoMinutesAgo(60),
  updatedAt: isoMinutesAgo(30),
  location: { id: makeId("location"), name: "Acceso Principal", aisle: "A", spot: "1", number: "01" },
  guard: { id: makeId("guard"), name: "Guardia", lastName: "Demo", username: "guardia.demo" },
  tasks: [{ id: makeId("task"), description: "Verificar acceso", reqPhoto: false, completed: false }],
  kardex: [],
  ...overrides,
});
