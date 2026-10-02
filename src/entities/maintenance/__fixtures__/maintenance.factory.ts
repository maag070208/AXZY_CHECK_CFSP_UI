import { isoMinutesAgo, makeId } from "@shared/testing";
import type { Maintenance } from "../model/types";

export const makeMaintenance = (overrides: Partial<Maintenance> = {}): Maintenance => ({
  id: makeId("maintenance"),
  title: "Desperfecto de prueba",
  description: "Descripción de prueba",
  category: null,
  status: "PENDING",
  createdAt: isoMinutesAgo(10),
  resolvedAt: null,
  latitude: null,
  longitude: null,
  media: [],
  guard: { id: makeId("guard"), name: "Guardia", lastName: "Demo", username: "guardia.demo" },
  resolvedBy: null,
  categoryRel: { id: makeId("category"), name: "Eléctrico", icon: "wrench", color: "#F4B942" },
  client: { id: makeId("client"), name: "Cliente Demo" },
  ...overrides,
});
