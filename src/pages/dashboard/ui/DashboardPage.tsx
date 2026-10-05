import { ITPage, ITText } from "@axzydev/axzy_ui_system";
import { SemanticTone, TONES } from "@shared/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaBell, FaClipboardList, FaClock, FaExclamationTriangle, FaMap, FaMapMarkerAlt, FaRoute, FaShieldAlt, FaUserClock, FaUsers } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import { AppState } from "@app/core/store/store";
import {
  getDashboardAttendance,
  getDashboardPendingCounts,
  getLiveDashboard,
  IAttendanceReport,
  ILiveDashboard,
  IPendingCounts,
} from "@entities/supervision";
import { ActiveRoundsPanel } from "./components/ActiveRoundsPanel";
import { AttendancePanel } from "./components/AttendancePanel";
import { LiveAlertsPanel } from "./components/LiveAlertsPanel";
import { LiveControls } from "./components/LiveControls";
import { LiveMap } from "./components/LiveMap";
import { Panel } from "./components/Panel";
import { PendingCountsPanel } from "./components/PendingCountsPanel";
import { StatusStrip } from "./components/StatusStrip";
import { BOARD } from "./components/board";

/** Respaldo por si Ably no entrega eventos: los estados también cambian con la hora. */
const POLL_MS = 60_000;

/** Eventos en vivo que cambian lo que muestra el dashboard. */
const REFRESH_ON = new Set(["incident", "maintenance", "discipline", "panic", "guard_status", "round", "kardex", "shift_handover", "uniform_check"]);

/** Contador compacto que acompaña al título de un panel. */
const Counter = ({ value, tone = "neutral" }: { value: number; tone?: SemanticTone }) => (
  <span
    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] font-black tabular-nums ${
      tone === "neutral" ? `${TONES.neutral.soft} ${TONES.neutral.softText}` : `${TONES[tone].soft} ${TONES[tone].softText}`
    }`}
  >
    {value}
  </span>
);

/**
 * Monitoreo en vivo: sala de vigilancia de la operación. Postgres es la fuente
 * de verdad; Ably solo avisa que hay que volver a pedir los datos.
 *
 * Terminal densa: rail de métricas arriba y tablero a dos columnas con lo
 * accionable (alertas, cobertura y rondas, mapa) y lo que hay que atender
 * (pendientes, faltas y retardos del día).
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { isClient } = useSupervisionPermissions();
  const { data: clients } = useCatalog("client");
  const livePanicAlerts = useSelector((state: AppState) => state.panic.liveAlerts);
  const unreadPanicIds = useSelector((state: AppState) => state.panic.unreadIds);
  const activityEvents = useSelector((state: AppState) => state.activity.events);

  const [clientId, setClientId] = useState("");
  const [live, setLive] = useState<ILiveDashboard | null>(null);
  const [pendingCounts, setPendingCounts] = useState<IPendingCounts | null>(null);
  const [attendance, setAttendance] = useState<IAttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [liveRes, pendingRes, attendanceRes] = await Promise.all([
          getLiveDashboard(clientId || undefined),
          getDashboardPendingCounts(),
          getDashboardAttendance(clientId || undefined),
        ]);
        if (liveRes.success) {
          setLive(liveRes.data);
          setError(null);
        } else {
          setError(liveRes.messages?.[0] ?? "No se pudo cargar el monitoreo");
        }
        if (pendingRes.success) setPendingCounts(pendingRes.data);
        if (attendanceRes.success) setAttendance(attendanceRes.data);
      } catch (err: any) {
        setError(err?.messages?.[0] ?? "No se pudo cargar el monitoreo");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientId],
  );

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const id = window.setInterval(() => void fetchAll(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchAll]);

  const lastEventRef = useRef<string | null>(null);
  useEffect(() => {
    const latest = activityEvents[0];
    if (!latest || latest.id === lastEventRef.current) return;
    lastEventRef.current = latest.id;
    if (REFRESH_ON.has(latest.type)) void fetchAll(true);
  }, [activityEvents, fetchAll]);

  const livePanic = useMemo(
    () => livePanicAlerts.filter((a) => unreadPanicIds.includes(a.id) && (!clientId || a.clientId === clientId)),
    [livePanicAlerts, unreadPanicIds, clientId],
  );

  const kpis = live?.kpis;
  const updatedAt = live ? new Date(live.generatedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
  const panicCount = kpis ? Math.max(kpis.pendingPanic, livePanic.length) : 0;
  const routesPercent = kpis && kpis.routesTotal ? Math.round((kpis.routesCovered / kpis.routesTotal) * 100) : null;
  const hasMap = (live?.mapPoints.length ?? 0) > 0;

  const controls = (
    <LiveControls
      isClient={isClient}
      clients={clients}
      clientId={clientId}
      onClientChange={setClientId}
      updatedAt={updatedAt}
      refreshing={refreshing}
      onRefresh={() => fetchAll(true)}
    />
  );

  return (
    <ITPage
      noPadding
      maxWidth="7xl"
      loading={loading && !live}
      error={!live ? error : null}
      onRetry={() => fetchAll()}
    >
      {/* ── Cabecera ─────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300">
            <FaShieldAlt size={20} />
          </span>
          <div className="min-w-0">
            <ITText as="h1" className="text-3xl font-bold tracking-tight text-secondary-800 dark:text-white">
              Monitoreo en vivo
            </ITText>
            <ITText as="p" className="mt-1 text-sm font-light text-secondary-500 dark:text-secondary-400">
              Qué está pasando ahora mismo en la operación.
            </ITText>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">{controls}</div>
      </header>

      {live && kpis && (
        <>
          {/* ── Rail de métricas ─────────────────────────────────────── */}
          <StatusStrip
            items={[
              {
                label: "Rondas activas",
                value: kpis.activeRounds,
                tone: kpis.activeRounds ? "brand" : "neutral",
                icon: <FaRoute />,
                note: kpis.stalledRounds ? `${kpis.stalledRounds} estancada${kpis.stalledRounds === 1 ? "" : "s"}` : undefined,
                noteTone: kpis.stalledRounds ? "down" : "neutral",
                onClick: () => navigate("/rounds"),
              },
              {
                label: "Personal en turno",
                value: kpis.guardsOnShift,
                tone: kpis.guardsOnShift ? "info" : "neutral",
                icon: <FaUsers />,
                onClick: () => navigate("/guards"),
              },
              {
                label: "Incidencias abiertas",
                value: kpis.openIncidents,
                tone: kpis.openIncidents ? "warning" : "neutral",
                icon: <FaExclamationTriangle />,
                note: kpis.openIncidents ? "por atender" : "sin pendientes",
                noteTone: kpis.openIncidents ? "down" : "neutral",
                onClick: () => navigate("/incidents"),
              },
              {
                label: "Cobertura de rutas",
                value: `${kpis.routesCovered}/${kpis.routesTotal}`,
                tone: routesPercent !== null && routesPercent < 100 ? "info" : "neutral",
                icon: <FaMap />,
                note: routesPercent === null ? "sin rutas" : `${routesPercent}%`,
                onClick: () => navigate("/routes"),
              },
              {
                label: "Faltas hoy",
                value: attendance?.totals.absent ?? "—",
                tone: attendance?.totals.absent ? "danger" : "neutral",
                icon: <FaUserClock />,
                note: attendance ? `${attendance.totals.expected} esperados` : undefined,
                noteTone: attendance?.totals.absent ? "down" : "neutral",
              },
              {
                label: "Retardos hoy",
                value: attendance?.totals.late ?? "—",
                tone: attendance?.totals.late ? "warning" : "neutral",
                icon: <FaClock />,
                note: attendance ? `${attendance.totals.onTime} a tiempo` : undefined,
                onClick: () => navigate("/guard-logs"),
              },
            ]}
          />

          {/* ── Pánico: lo único que grita ───────────────────────────── */}
          {panicCount > 0 && (
            <button
              type="button"
              onClick={() => navigate("/panic-alerts")}
              className="group flex w-full items-center gap-4 rounded-2xl bg-danger-600 p-4 text-left text-white shadow-lg shadow-danger-200/60 transition-colors hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-300"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FaBell className="animate-pulse" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black uppercase tracking-wider">
                  {panicCount} {panicCount === 1 ? "alerta de pánico" : "alertas de pánico"} sin atender
                </span>
                <span className="block truncate text-xs text-white/80">
                  {livePanic[0] ? `Última: ${livePanic[0].guardName}${livePanic[0].clientName ? ` · ${livePanic[0].clientName}` : ""}` : "Revisa y atiende de inmediato"}
                </span>
              </span>
              <span className="shrink-0 text-xs font-bold underline underline-offset-4">Atender</span>
            </button>
          )}

          {/* ── Tablero a dos columnas ───────────────────────────────── */}
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
            <div className="space-y-5 xl:col-span-8">
              <Panel
                title="Alertas en vivo"
                accent="danger"
                icon={<FaExclamationTriangle size={14} />}
                badge={<Counter value={live.alerts.length} tone={live.alerts.length ? "danger" : "neutral"} />}
              >
                <LiveAlertsPanel alerts={live.alerts} />
              </Panel>

              <Panel
                title="Cobertura y rondas"
                accent="success"
                icon={<FaRoute size={14} />}
                badge={
                  <ITText as="span" className={`font-mono text-[10px] tabular-nums ${BOARD.label}`}>
                    {kpis.routesCovered}/{kpis.routesTotal} · {kpis.activeRounds} activas
                  </ITText>
                }
              >
                <ActiveRoundsPanel rounds={live.activeRounds} uncoveredRoutes={live.uncoveredRoutes} />
              </Panel>

              {hasMap && (
                <Panel title="Última ubicación conocida" accent="info" icon={<FaMapMarkerAlt size={14} />}>
                  <LiveMap points={live.mapPoints} height={320} />
                </Panel>
              )}
            </div>

            <div className="space-y-5 xl:col-span-4">
              <Panel title="Pendientes por atender" accent="warning" icon={<FaClipboardList size={14} />}>
                <PendingCountsPanel counts={pendingCounts} />
              </Panel>

              <Panel title="Faltas y retardos · hoy" accent="danger" icon={<FaUserClock size={14} />}>
                <AttendancePanel report={attendance} />
              </Panel>
            </div>
          </div>
        </>
      )}
    </ITPage>
  );
};

export default DashboardPage;
