import { ITBadget, ITProgress, ITText } from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaClock, FaMapMarkerAlt, FaRoute, FaRoute as FaRouteIcon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ILiveRound, LiveRoundState } from "@app/core/types/supervision.types";
import { formatMinutes, fullName, timeAgo } from "@app/core/utils/supervision.utils";

const STATE_META: Record<
  LiveRoundState,
  { label: string; color: "success" | "warning" | "gray"; bar: "success" | "warning" | "gray"; accent: string }
> = {
  ON_TRACK: { label: "En curso", color: "success", bar: "success", accent: "bg-emerald-500" },
  STALLED: { label: "Estancada", color: "warning", bar: "warning", accent: "bg-amber-500" },
  ABANDONED: { label: "Sin cerrar", color: "gray", bar: "gray", accent: "bg-slate-300" },
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
            <FaRouteIcon size={18} />
          </span>
          <ITText className="text-sm font-bold text-slate-600">Nadie está haciendo ronda ahora</ITText>
          <ITText className="mt-0.5 text-xs text-slate-400">Las rondas en curso aparecerán aquí.</ITText>
        </div>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {live.map((r) => (
            <RoundCard key={r.roundId} round={r} onClick={() => navigate(`/rounds/${r.roundId}`)} />
          ))}
        </div>
      )}

      {abandoned.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50"
            onClick={() => setShowAbandoned((v) => !v)}
          >
            <ITText className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
              {abandoned.length} {abandoned.length === 1 ? "ronda abierta" : "rondas abiertas"} sin cerrar
            </ITText>
            <ITText className="text-[11px] font-bold text-emerald-700">{showAbandoned ? "Ocultar" : "Ver"}</ITText>
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
        <div className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 ring-1 ring-slate-100">
          <ITText as="span" className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Sin recorrer ahora
          </ITText>
          <ITText className="mt-0.5 text-[11px] font-medium leading-snug text-slate-600">
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
      className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 pl-4 text-left transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,0.25)]"
    >
      <span className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${meta.accent}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <ITText className="truncate text-[13px] font-black leading-tight text-slate-800">{fullName(round.guard)}</ITText>
          <ITText className="truncate text-[11px] font-medium text-slate-500">
            {[round.routeTitle ?? "Ronda libre", round.clientName].filter(Boolean).join(" · ")}
          </ITText>
        </div>
        <ITBadget color={meta.color} size="sm">
          {meta.label}
        </ITBadget>
      </div>

      {round.progressPercent !== null && (
        <div className="mt-2.5 flex items-center gap-2.5">
          <ITProgress value={round.progressPercent} size="sm" color={meta.bar} className="flex-1" />
          <ITText as="span" className="shrink-0 text-[10px] font-black tabular-nums text-slate-500">
            {round.progressPercent}%
          </ITText>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <FaClock size={9} className="text-slate-400" /> {formatMinutes(round.elapsedMinutes)}
        </span>
        {round.totalLocations !== null && (
          <span className="font-bold tabular-nums text-slate-600">
            {round.scannedCount}/{round.totalLocations} puntos
          </span>
        )}
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <FaMapMarkerAlt size={9} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {round.lastScan ? `${round.lastScan.locationName} · ${timeAgo(round.lastScan.timestamp)}` : "Sin escaneos aún"}
          </span>
        </span>
      </div>
    </button>
  );
};
