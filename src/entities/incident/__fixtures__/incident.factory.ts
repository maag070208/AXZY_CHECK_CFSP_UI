/**
 * Factoría de incidencias para tests.
 *
 * Vive junto a la entidad (no en `shared`) porque conoce su modelo. Así un
 * cambio en `Incident` se resuelve en un archivo y no en cada test.
 */
import { makeId, isoMinutesAgo } from "@shared/testing";
import type { Incident } from "../model/types";

export const makeIncident = (overrides: Partial<Incident> = {}): Incident => ({
  id: makeId("incident"),
  guardId: makeId("guard"),
  title: "Novedad de prueba",
  categoryId: makeId("category"),
  typeId: makeId("type"),
  description: "Descripción de prueba",
  media: [],
  latitude: null,
  longitude: null,
  createdAt: isoMinutesAgo(10),
  resolvedAt: null,
  resolvedById: null,
  status: "PENDING",
  clientId: makeId("client"),
  guard: { id: makeId("guard"), name: "Guardia", lastName: "Demo", username: "guardia.demo" },
  resolvedBy: null,
  category: { id: makeId("category"), name: "Acceso", icon: "shield", color: "#009F73" },
  type: { id: makeId("type"), name: "Novedad" },
  client: { id: makeId("client"), name: "Cliente Demo" },
  ...overrides,
});
