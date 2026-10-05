import { ITBadget, ITText } from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaClock, FaMapMarkerAlt, FaRoute } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ILiveRound, LiveRoundState } from "@entities/supervision";
import { formatMinutes, fullName, timeAgo } from "@app/core/utils/supervision.utils";
import { TONES } from "@shared/ui";
import { BOARD } from "./board";

const STATE_META: Record<LiveRoundState, { label: string; badge: "success" | "warning" | "gray"; pct: string }> = {
  ON_TRACK: { label: "En curso", badge: "success", pct: "bg-success-500" },
  STALLED: { label: "Estancada", badge: "warning", pct: "bg-warning-500" },
  ABANDONED: { label: "Sin cerrar", badge: "gray", pct: "bg-secondary-400" },
};

/** Rondas en curso con su avance; las abandonadas se agrupan aparte. */
export const ActiveRoundsPanel = ({ rounds, uncoveredRoutes }: { rounds: ILiveRound[]; uncoveredRoutes: { id: string; title: string }[] }) => {
  const navigate = useNavigate();
  const [showAbandoned, setShowAbandoned] = useState(false);
  const live = rounds.filter((r) => r.state !== "ABANDONED");
  const abandoned = rounds.filter((r) => r.state === "ABANDONED");

  return (
    <div className="flex h-full flex-col">
      {live.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-200 py-10 text-center dark:border-secondary-700">
          <span className={`${BOARD.tile} mb-3 h-12 w-12 rounded-2xl bg-secondary-50 text-secondary-300 dark:bg-secondary-800 dark:text-secondary-500`}>
            <FaRoute size={18} />
          </span>
          <ITText as="p" className={`text-[13px] font-bold ${BOARD.strong}`}>
            Nadie está haciendo ronda ahora
          </ITText>
          <ITText as="p" className={`mt-0.5 ${BOARD.label}`}>
            Las rondas en curso aparecerán aquí.
          </ITText>
        </div>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {live.map((r) => (
            <RoundCard key={r.roundId} round={r} onClick={() => navigate(`/rounds/${r.roundId}`)} />
          ))}
        </div>
      )}

      {abandoned.length > 0 && (
        <div className="mt-3 border-t border-secondary-100 pt-3 dark:border-secondary-800">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:bg-secondary-800/60"
            onClick={() => setShowAbandoned((v) => !v)}
          >
            <ITText as="span" className={BOARD.title}>
              {abandoned.length} {abandoned.length === 1 ? "ronda abierta" : "rondas abiertas"} sin cerrar
            </ITText>
            <ITText as="span" className={`text-[11px] font-bold ${TONES.brand.text}`}>
              {showAbandoned ? "Ocultar" : "Ver"}
            </ITText>
          </button>
          {showAbandoned && (
            <div className="mt-2 space-y-2">
              {abandoned.map((r) => (
                <RoundCard key={r.roundId} round={r} onClick={() => navigate(`/rounds/${r.roundId}`)} />
              ))}
            </div>
          )}
        </div>
      )}

      {uncoveredRoutes.length > 0 && (
        <div className="mt-3 rounded-xl bg-secondary-50 px-3.5 py-2.5 dark:bg-secondary-800/60">
          <ITText as="span" className={BOARD.title}>
            Sin recorrer ahora
          </ITText>
          <ITText as="p" className={`mt-0.5 text-[11px] font-medium leading-snug ${BOARD.label}`}>
            {uncoveredRoutes.slice(0, 4).map((r) => r.title).join(", ")}
            {uncoveredRoutes.length > 4 ? ` y ${uncoveredRoutes.length - 4} más` : ""}
          </ITText>
        </div>
      )}
    </div>
  );
};

const RoundCard = ({ round, onClick }: { round: ILiveRound; onClick: () => void }) => {
  const meta = STATE_META[round.state];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-secondary-200 bg-white p-3.5 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-secondary-300 hover:shadow-[0_10px_24px_-16px_rgba(15,23,42,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-secondary-700 dark:bg-secondary-900 dark:hover:border-secondary-600"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <ITText as="p" className={`truncate text-[13px] font-bold leading-tight ${BOARD.strong}`}>
            {fullName(round.guard)}
          </ITText>
          <ITText as="p" className={`truncate text-[11px] ${BOARD.label}`}>
            {[round.routeTitle ?? "Ronda libre", round.clientName].filter(Boolean).join(" · ")}
          </ITText>
        </div>
        <ITBadget color={meta.badge} size="sm" variant="outlined">
          {meta.label}
        </ITBadget>
      </div>

      {round.progressPercent !== null && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary-100 dark:bg-secondary-800">
            <span className={`block h-full rounded-full ${meta.pct}`} style={{ width: `${round.progressPercent}%` }} />
          </span>
          <ITText as="span" className="shrink-0 text-[10px] font-bold tabular-nums text-secondary-500 dark:text-secondary-400">
            {round.progressPercent}%
          </ITText>
        </div>
      )}

      <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium ${BOARD.label}`}>
        <span className="inline-flex items-center gap-1.5">
          <FaClock size={9} className="text-secondary-400" /> {formatMinutes(round.elapsedMinutes)}
        </span>
        {round.totalLocations !== null && (
          <span className="font-bold tabular-nums text-secondary-600 dark:text-secondary-300">
            {round.scannedCount}/{round.totalLocations} puntos
          </span>
        )}
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <FaMapMarkerAlt size={9} className="shrink-0 text-secondary-400" />
          <span className="truncate">
            {round.lastScan ? `${round.lastScan.locationName} · ${timeAgo(round.lastScan.timestamp)}` : "Sin escaneos aún"}
          </span>
        </span>
      </div>
    </button>
  );
};
