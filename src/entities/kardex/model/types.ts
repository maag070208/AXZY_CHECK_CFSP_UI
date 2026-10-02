/**
 * Modelo de la entidad Kardex (marcajes de campo con evidencia).
 *
 * Incluye `translateScanType`, que antes vivía en `core/utils/status.utils.ts`
 * siendo dominio exclusivo de kardex (sólo lo usaban sus dos archivos).
 */
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Zona horaria de la operación. */
export const OPERATIONS_TIMEZONE = "America/Tijuana";

export type KardexScanType = "ASSIGNMENT" | "RECURRING" | "FREE";

export type KardexMedia = {
  url: string;
  type: "IMAGE" | "VIDEO";
  description?: string;
  key?: string;
};

export type KardexEntry = {
  id: string;
  userId: string;
  locationId: string;
  timestamp: string;
  notes?: string;
  media?: KardexMedia[] | null;
  latitude?: number | null;
  longitude?: number | null;
  scanType: KardexScanType;
  assignmentId?: string | null;
  user: {
    id: string;
    name: string;
    lastName?: string | null;
    username: string;
    role: string;
  };
  location: {
    id: string;
    name: string;
    aisle: string;
    spot: string;
    number: string;
  };
  assignment?: { id: string; status: string } | null;
};

export type KardexStatusFilter = "ALL" | "ASSIGNMENT" | "RECURRING";

/** Etiqueta legible y color de badge por tipo de marcaje. */
export const SCAN_TYPE_META: Record<KardexScanType, { label: string; badge: "success" | "warning" | "primary" }> = {
  ASSIGNMENT: { label: "Asignada", badge: "success" },
  RECURRING: { label: "Ronda", badge: "warning" },
  FREE: { label: "Libre", badge: "primary" },
};

/** Traduce el tipo de marcaje; deja pasar valores desconocidos. */
export const translateScanType = (type: string): string =>
  SCAN_TYPE_META[type as KardexScanType]?.label ?? type;

/** "14:32:05 HRS" en la zona de operación. */
export const formatScanTime = (iso: string): string =>
  dayjs(iso).tz(OPERATIONS_TIMEZONE).format("HH:mm:ss [HRS]");

/** "01 oct, 2026" en la zona de operación. */
export const formatScanDate = (iso: string): string =>
  dayjs(iso).tz(OPERATIONS_TIMEZONE).format("DD MMM, YYYY");

/** Rango del día en curso en la zona de operación. */
export const todayRange = (): [Date, Date] => [
  dayjs().tz(OPERATIONS_TIMEZONE).startOf("day").toDate(),
  dayjs().tz(OPERATIONS_TIMEZONE).endOf("day").toDate(),
];
