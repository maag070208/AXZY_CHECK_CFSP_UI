import { isoMinutesAgo, makeId } from "@shared/testing";
import type { ScheduledNotification } from "../model/types";

export const makeScheduledNotification = (
  overrides: Partial<ScheduledNotification> = {},
): ScheduledNotification => ({
  id: makeId("notification"),
  title: "Aviso de prueba",
  message: "Mensaje de prueba",
  type: "info",
  persistent: false,
  channel: "global",
  userId: null,
  frequency: "DAILY",
  timeOfDay: "08:00",
  scheduledAt: null,
  active: true,
  sendCount: 0,
  lastSentAt: null,
  nextSendAt: null,
  createdAt: isoMinutesAgo(60),
  targetUser: null,
  ...overrides,
});
