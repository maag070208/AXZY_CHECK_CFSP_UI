import { makeId } from "@shared/testing";
import type { Schedule } from "../model/types";

export const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: makeId("schedule"),
  name: "Matutino",
  startTime: "06:00",
  endTime: "14:00",
  active: true,
  ...overrides,
});
