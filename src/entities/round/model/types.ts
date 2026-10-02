/**
 * Modelo de la entidad Ronda (ejecución de una ruta por un guardia).
 *
 * Endpoints verificados contra `API/src/modules/rounds/round.routes.ts`:
 * `/rounds`, `/rounds/datatable`, `/rounds/start`, `/rounds/:id/end`.
 */
export type RoundStatus = "IN_PROGRESS" | "COMPLETED";

export type RoundGuardRef = {
  id: string;
  name: string;
  lastName: string | null;
};

export type RoundLocationRef = {
  id: string;
  locationId: string;
  location: { id: string; name: string };
};

export type RoundClientRef = {
  id: string;
  name: string;
  locations?: { id: string; name: string }[];
};

export type RoundConfigurationRef = {
  id: string;
  title: string;
  startTime?: string;
  endTime?: string;
  client?: { id: string; name: string } | null;
  recurringLocations?: RoundLocationRef[];
};

export type Round = {
  id: string;
  guardId: string;
  clientId?: string | null;
  startTime: string;
  endTime?: string | null;
  status: RoundStatus;
  recurringConfigurationId: string;
  recurringConfiguration?: RoundConfigurationRef | null;
  guard: RoundGuardRef;
  client?: RoundClientRef | null;
  _count?: { kardexEntries: number };
};

export type RoundEventType = "START" | "SCAN" | "INCIDENT" | "END";

/** Carga útil de un evento de ronda (escaneo, incidencia…). */
export type RoundEventData = {
  location?: { id: string; name: string; aisle?: string | null; spot?: string | null; number?: string | null } | null;
  /** `MediaItem` del UI system usa los tipos en mayúsculas. */
  media?: { id: string; url: string; type?: 'IMAGE' | 'VIDEO' | null }[];
  latitude?: number;
  longitude?: number;
  notes?: string | null;
  /** Informe de novedad asociado al escaneo, si lo hay. */
  assignment?: {
    id: string;
    status?: string;
    notes?: string | null;
    tasks?: { id: string; description: string; completed: boolean; reqPhoto?: boolean }[];
  } | null;
};

export type RoundEvent = {
  type: RoundEventType;
  timestamp: string;
  description: string;
  guard?: RoundGuardRef | null;
  data: RoundEventData;
};

export type RoundDetail = {
  round: Round;
  timeline: RoundEvent[];
};

/** Etiqueta y color de badge por estado de la ronda. */
export const ROUND_STATUS_META: Record<RoundStatus, { label: string; badge: "success" | "warning" }> = {
  IN_PROGRESS: { label: "En curso", badge: "warning" },
  COMPLETED: { label: "Completada", badge: "success" },
};

/**
 * Duración legible de una ronda.
 *
 * Devuelve `"En curso"` si no ha terminado, y `"—"` si las fechas no son
 * válidas (antes se pintaba `NaN h NaN min`).
 */
export const roundDuration = (round: Pick<Round, "startTime" | "endTime" | "status">): string => {
  if (round.status === "IN_PROGRESS" || !round.endTime) return "En curso";

  const start = new Date(round.startTime).getTime();
  const end = new Date(round.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";

  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

/** Progreso de puntos escaneados: "3/8". */
export const roundProgress = (round: Round): string => {
  const total = round.recurringConfiguration?.recurringLocations?.length ?? 0;
  const done = round._count?.kardexEntries ?? 0;
  return `${done}/${total}`;
};
