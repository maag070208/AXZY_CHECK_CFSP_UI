import { makeId } from "@shared/testing";
import type { User } from "../model/types";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: makeId("user"),
  name: "Usuario",
  lastName: "Demo",
  username: "usuario.demo",
  roleId: makeId("role"),
  role: { id: makeId("role"), name: "GUARD", value: "GUARD" },
  active: true,
  shiftStart: "06:00",
  shiftEnd: "14:00",
  schedule: null,
  scheduleId: null,
  clientId: null,
  client: null,
  ...overrides,
});
