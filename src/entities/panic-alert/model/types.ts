/**
 * Modelo de la entidad Alerta de pánico.
 *
 * Es la alerta que un guardia dispara desde campo; el ciclo de vida va de
 * `PENDING` a `RESOLVED`/`DISMISSED`, pasando por `IN_PROGRESS`.
 */
import dayjs from "dayjs";

export type PanicAlertStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

export type PanicAlertPerson = {
  id: string;
  name: string;
  lastName?: string | null;
  username?: string;
};

export type PanicAlert = {
  id: string;
  guardId: string;
  guard: PanicAlertPerson;
  clientId: string | null;
  client: { id: string; name: string } | null;
  source: string;
  triggerLatitude: number | null;
  triggerLongitude: number | null;
  triggerAccuracy: number | null;
  message: string | null;
  status: PanicAlertStatus;
  resolutionComment: string | null;
  resolvedById: string | null;
  resolvedBy: PanicAlertPerson | null;
  resolvedAt: string | null;
  createdAt: string;
};

/** Etiqueta y color de badge por estado. */
export const PANIC_STATUS_META: Record<
  PanicAlertStatus,
  { label: string; badge: "danger" | "warning" | "success" | "secondary" }
> = {
  PENDING: { label: "Pendiente", badge: "danger" },
  IN_PROGRESS: { label: "En progreso", badge: "warning" },
  RESOLVED: { label: "Atendida", badge: "success" },
  DISMISSED: { label: "Descartada", badge: "secondary" },
};

/** Nombre completo del guardia, o "—" si no viene. */
export const guardName = (alert: Pick<PanicAlert, "guard">): string =>
  alert.guard ? `${alert.guard.name} ${alert.guard.lastName ?? ""}`.trim() : "—";

/** ¿Tiene coordenadas para abrir el mapa? */
export const hasCoordinates = (
  alert: Pick<PanicAlert, "triggerLatitude" | "triggerLongitude">,
): boolean => alert.triggerLatitude != null && alert.triggerLongitude != null;

/** URL de Google Maps con el punto del disparo. */
export const mapsUrl = (alert: Pick<PanicAlert, "triggerLatitude" | "triggerLongitude">): string =>
  `https://www.google.com/maps?q=${alert.triggerLatitude},${alert.triggerLongitude}`;

/** "01 oct 2026" */
export const formatAlertDate = (iso: string): string => dayjs(iso).format("DD MMM YYYY");

/** "14:32" */
export const formatAlertTime = (iso: string): string => dayjs(iso).format("HH:mm");
