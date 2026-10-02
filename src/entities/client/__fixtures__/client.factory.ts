import { makeId } from "@shared/testing";
import type { Client } from "../model/types";

export const makeClient = (overrides: Partial<Client> = {}): Client => ({
  id: makeId("client"),
  name: "Cliente Demo",
  address: "Av. Reforma 123",
  rfc: "XAXX010101000",
  contactName: "Ana López",
  contactPhone: "5512345678",
  active: true,
  softDelete: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  locations: [],
  users: [],
  zones: [],
  ...overrides,
});
