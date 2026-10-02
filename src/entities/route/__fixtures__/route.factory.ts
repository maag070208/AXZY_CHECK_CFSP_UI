import { makeId } from "@shared/testing";
import type { Route } from "../model/types";

export const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  id: makeId("route"),
  title: "Ronda nocturna",
  clientId: makeId("client"),
  client: { name: "Cliente Demo" },
  guardId: null,
  active: true,
  status: "ACTIVE",
  tasks: [{ id: makeId("task"), description: "Verificar puerta", reqPhoto: false }],
  locations: [],
  guards: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
