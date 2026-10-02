import { isoMinutesAgo, makeId } from "@shared/testing";
import type { GuardLoginLog } from "../model/types";

export const makeGuardLog = (overrides: Partial<GuardLoginLog> = {}): GuardLoginLog => ({
  id: makeId("log"),
  userId: makeId("user"),
  loginAt: isoMinutesAgo(120),
  logoutAt: null,
  user: {
    id: makeId("user"),
    name: "Guardia",
    lastName: "Demo",
    username: "guardia.demo",
  },
  ...overrides,
});
