/**
 * Modelo de la entidad Notificación programada.
 *
 * Incluye las opciones de frecuencia y tipo (antes constantes sueltas en la
 * página) y la forma del formulario, para que la vista no las reinvente.
 */
import dayjs from "dayjs";

export type NotificationFrequency =
  | "ONCE"
  | "DAILY"
  | "EVERY_2_DAYS"
  | "WEEKLY"
  | "EVERY_2_WEEKS"
  | "MONTHLY";

export type NotificationType = "info" | "success" | "warning" | "error";

export type ScheduledNotification = {
  id: string;
  title?: string | null;
  message: string;
  type: string;
  persistent: boolean;
  channel: string;
  userId?: string | null;
  frequency: string;
  timeOfDay?: string | null;
  scheduledAt?: string | null;
  active: boolean;
  sendCount: number;
  lastSentAt?: string | null;
  nextSendAt?: string | null;
  createdAt: string;
  targetUser?: { id: string; name: string; lastName?: string | null } | null;
};

/** Datos del formulario de alta/edición. */
export type NotificationForm = {
  title: string;
  message: string;
  type: NotificationType;
  frequency: NotificationFrequency;
  timeOfDay: string;
  scheduledAt: string;
  persistent: boolean;
  active: boolean;
};

export const EMPTY_NOTIFICATION_FORM: NotificationForm = {
  title: "",
  message: "",
  type: "info",
  frequency: "ONCE",
  timeOfDay: "08:00",
  scheduledAt: "",
  persistent: false,
  active: true,
};

export const FREQUENCY_OPTIONS: { label: string; value: NotificationFrequency }[] = [
  { label: "Una vez", value: "ONCE" },
  { label: "Diario", value: "DAILY" },
  { label: "Cada 2 días", value: "EVERY_2_DAYS" },
  { label: "Semanal", value: "WEEKLY" },
  { label: "Cada 2 semanas", value: "EVERY_2_WEEKS" },
  { label: "Mensual", value: "MONTHLY" },
];

export const NOTIFICATION_TYPE_OPTIONS: { label: string; value: NotificationType }[] = [
  { label: "Informativa", value: "info" },
  { label: "Éxito", value: "success" },
  { label: "Advertencia", value: "warning" },
  { label: "Alerta", value: "error" },
];

/** Etiqueta legible de una frecuencia; deja pasar valores desconocidos. */
export const frequencyLabel = (frequency: string): string =>
  FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency;

/** Pasa una notificación al formulario de edición. */
export const toNotificationForm = (row: ScheduledNotification): NotificationForm => ({
  title: row.title ?? "",
  message: row.message,
  type: (row.type as NotificationType) ?? "info",
  frequency: (row.frequency as NotificationFrequency) ?? "ONCE",
  timeOfDay: row.timeOfDay ?? "08:00",
  scheduledAt: row.scheduledAt ? dayjs(row.scheduledAt).format("YYYY-MM-DDTHH:mm") : "",
  persistent: row.persistent,
  active: row.active,
});

/**
 * Convierte el formulario al payload de la API. En frecuencia `ONCE` no se
 * manda `timeOfDay` (no aplica), y `scheduledAt` viaja en ISO.
 */
export const toNotificationPayload = (form: NotificationForm) => {
  const payload: Record<string, unknown> = {
    ...form,
    scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
  };
  if (form.frequency === "ONCE") delete payload.timeOfDay;
  return payload;
};

/** ¿Se puede guardar? El mensaje es obligatorio. */
export const canSaveNotification = (form: NotificationForm): boolean => form.message.trim().length > 0;
