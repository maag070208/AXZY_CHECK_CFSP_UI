/**
 * Modelo de la entidad Registro de asistencia (prenómina).
 *
 * `loginAt` / `logoutAt` llegan en UTC y **siempre** se muestran en la zona
 * horaria de operación, no en la del navegador: el guardia entra a las 06:00 en
 * Tijuana aunque el equipo esté en otra zona.
 */
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Zona horaria de la operación. */
export const OPERATIONS_TIMEZONE = "America/Tijuana";

export type GuardLogUser = {
  id: string;
  name: string;
  lastName: string | null;
  username: string;
};

export type GuardLoginLog = {
  id: string;
  userId: string;
  loginAt: string;
  logoutAt: string | null;
  user: GuardLogUser;
};

export type GuardLogStatusFilter = "ALL" | "OPEN" | "CLOSED";

/** Fecha en la zona de operación. */
export const toOperationsTime = (iso: string) => dayjs(iso).tz(OPERATIONS_TIMEZONE);

/** "06 oct 2026" en la zona de operación. */
export const formatLogDate = (iso: string): string => toOperationsTime(iso).format("DD MMM YYYY");

/** "06:12:30" en la zona de operación. */
export const formatLogTime = (iso: string): string => toOperationsTime(iso).format("HH:mm:ss");

/** Rango [inicio, fin] del día en curso en la zona de operación. */
export const todayRange = (): [Date, Date] => [
  dayjs().tz(OPERATIONS_TIMEZONE).startOf("day").toDate(),
  dayjs().tz(OPERATIONS_TIMEZONE).endOf("day").toDate(),
];

/**
 * Duración trabajada en formato `HH:mm`. `null` si el turno sigue abierto
 * (no se puede medir todavía).
 */
export const formatLogDuration = (log: Pick<GuardLoginLog, "loginAt" | "logoutAt">): string | null => {
  if (!log.logoutAt) return null;
  const diff = dayjs(log.logoutAt).diff(dayjs(log.loginAt));
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/** ¿El turno sigue abierto? */
export const isLogOpen = (log: Pick<GuardLoginLog, "logoutAt">): boolean => !log.logoutAt;
