import { makeId } from "@shared/testing";
import type { IncidentCategory, IncidentType, SysConfig } from "../model/types";

export const makeCategory = (overrides: Partial<IncidentCategory> = {}): IncidentCategory => ({
  id: makeId("category"),
  name: "Falla eléctrica",
  value: "FALLA_ELECTRICA",
  type: "INCIDENT",
  color: null,
  icon: null,
  active: true,
  ...overrides,
});

export const makeType = (overrides: Partial<IncidentType> = {}): IncidentType => ({
  id: makeId("type"),
  categoryId: makeId("category"),
  name: "Corto circuito",
  value: "CORTO_CIRCUITO",
  ...overrides,
});

export const makeSysConfig = (overrides: Partial<SysConfig> = {}): SysConfig => ({
  key: "ROUND_TOLERANCE_MINUTES",
  value: "15",
  ...overrides,
});
