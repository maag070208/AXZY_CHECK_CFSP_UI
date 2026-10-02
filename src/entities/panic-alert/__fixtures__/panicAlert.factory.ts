import { isoMinutesAgo, makeId } from "@shared/testing";
import type { PanicAlert } from "../model/types";

export const makePanicAlert = (overrides: Partial<PanicAlert> = {}): PanicAlert => ({
  id: makeId("panic"),
  guardId: makeId("guard"),
  guard: { id: makeId("guard"), name: "Guardia", lastName: "Demo", username: "guardia.demo" },
  clientId: makeId("client"),
  client: { id: makeId("client"), name: "Cliente Demo" },
  source: "APP",
  triggerLatitude: 32.5225,
  triggerLongitude: -117.0231,
  triggerAccuracy: 10,
  message: "Alerta de prueba",
  status: "PENDING",
  resolutionComment: null,
  resolvedById: null,
  resolvedBy: null,
  resolvedAt: null,
  createdAt: isoMinutesAgo(5),
  ...overrides,
});
