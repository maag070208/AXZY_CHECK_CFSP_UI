import {
  ITButton,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { SemanticTone, TONES } from "@shared/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBell,
  FaCalendarCheck,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaRoute,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import { AppState } from "@app/core/store/store";
import { ILiveDashboard } from "@app/core/types/supervision.types";
import { ActiveGuardRow } from "../components/ActiveGuardRow";
import { ActiveRoundsPanel } from "../components/ActiveRoundsPanel";
import { ActivityItemRow } from "../components/ActivityItemRow";
import { CompliancePanel } from "../components/CompliancePanel";
import { LiveAlertsPanel } from "../components/LiveAlertsPanel";
import { LiveControls } from "../components/LiveControls";
import { LiveMap } from "../components/LiveMap";
import { Panel } from "../components/Panel";
import { StatusStrip } from "../components/StatusStrip";
import {
  getDashboardActiveGuards,
  getDashboardRecentActivity,
  getLiveDashboard,
  IActiveGuard,
  IActivityItem,
} from "../services/DashboardService";

/** Respaldo por si Ably no entrega eventos: los estados también cambian con la hora. */
const POLL_MS = 60_000;

/** Eventos en vivo que cambian lo que muestra el dashboard. */
const REFRESH_ON = new Set(["incident", "maintenance", "discipline", "panic", "guard_status", "round", "kardex", "shift_handover", "uniform_check"]);

const percentLabel = (p: number | null) => (p === null ? "—" : `${p}%`);

/** Contador compacto que acompaña al título de un panel. */
const Counter = ({ value, tone = "neutral" }: { value: number; tone?: SemanticTone }) => (
  <span
    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black tabular-nums ${
      tone === "neutral" ? TONES.neutral.soft + " " + TONES.neutral.softText : TONES[tone].soft + " " + TONES[tone].softText
    }`}
  >
    {value}
  </span>
);

/**
 * Monitoreo en vivo: qué está pasando ahora en la operación. Postgres es la
 * fuente de verdad; Ably solo avisa que hay que volver a pedir los datos.
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { canRegister, isClient } = useSupervisionPermissions();
  const { data: clients } = useCatalog("client");
  const livePanicAlerts = useSelector((state: AppState) => state.panic.liveAlerts);
  const unreadPanicIds = useSelector((state: AppState) => state.panic.unreadIds);
  const activityEvents = useSelector((state: AppState) => state.activity.events);

  const [clientId, setClientId] = useState("");
  const [bottomTab, setBottomTab] = useState<"staff" | "activity">("staff");
  const [live, setLive] = useState<ILiveDashboard | null>(null);
  const [guards, setGuards] = useState<IActiveGuard[]>([]);
  const [activity, setActivity] = useState<IActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const [liveRes, guardsRes, activityRes] = await Promise.all([
          getLiveDashboard(clientId || undefined),
          getDashboardActiveGuards(),
          getDashboardRecentActivity(25),
        ]);
        if (liveRes.success) {
          setLive(liveRes.data);
          setError(null);
        } else {
          setError(liveRes.messages?.[0] ?? "No se pudo cargar el monitoreo");
        }
        if (guardsRes.success) setGuards(guardsRes.data);
        if (activityRes.success) setActivity(activityRes.data);
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

  // Los endpoints de personal y actividad no filtran por cliente: se filtra aquí.
  const scopedGuards = useMemo(
    () =>
      guards
        .filter((g) => !clientId || g.clientId === clientId)
        .sort((a, b) => Number(b.isLoggedIn) - Number(a.isLoggedIn) || a.name.localeCompare(b.name)),
    [guards, clientId],
  );
  const scopedActivity = useMemo(
    () => activity.filter((a) => !clientId || a.clientId === clientId),
    [activity, clientId],
  );
  const onlineGuards = scopedGuards.filter((g) => g.isLoggedIn);
  const livePanic = livePanicAlerts.filter((a) => unreadPanicIds.includes(a.id) && (!clientId || a.clientId === clientId));

  const kpis = live?.kpis;
  const updatedAt = live ? new Date(live.generatedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
  const panicCount = kpis ? Math.max(kpis.pendingPanic, livePanic.length) : 0;
  const routesPercent = kpis && kpis.routesTotal ? Math.round((kpis.routesCovered / kpis.routesTotal) * 100) : null;

  // Solo se muestran los bloques que tienen datos: el home no debe llenarse de
  // paneles vacíos.
  const nothingPlanned = live ? live.compliance.handover.total === 0 && live.compliance.uniform.total === 0 : false;
  const hasCompliance = !nothingPlanned;
  const hasRounds = (live?.activeRounds.length ?? 0) > 0;
  const hasMap = (live?.mapPoints.length ?? 0) > 0;

  return (
    <ITPage
      noPadding
      title="Monitoreo en vivo"
      description="Qué está pasando ahora mismo en la operación."
      icon={<FaShieldAlt size={20} />}
      loading={loading && !live}
      error={!live ? error : null}
      onRetry={() => fetchAll()}
      actions={
        <div className="hidden lg:flex flex-wrap items-center justify-end gap-2">
          <LiveControls
            isClient={isClient}
            clients={clients}
            clientId={clientId}
            onClientChange={setClientId}
            updatedAt={updatedAt}
            refreshing={refreshing}
            onRefresh={() => fetchAll(true)}
          />
        </div>
      }
    >
      {/* En pantallas angostas los controles viven aquí: en el header
          aplastarían el título y la descripción. */}
      <div className="flex flex-wrap items-center gap-2 lg:hidden">
        <LiveControls
          isClient={isClient}
          clients={clients}
          clientId={clientId}
          onClientChange={setClientId}
          updatedAt={updatedAt}
          refreshing={refreshing}
          onRefresh={() => fetchAll(true)}
          stacked
        />
      </div>

      {live && kpis && (
        <>
          {panicCount > 0 && (
            <button
              type="button"
              onClick={() => navigate("/panic-alerts")}
              className="group flex w-full items-center gap-4 rounded-2xl bg-danger-600 p-4 text-left text-white shadow-lg shadow-danger-200 transition-colors hover:bg-danger-700"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FaBell className="animate-pulse" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-black uppercase tracking-wider">
                  {panicCount} {panicCount === 1 ? "alerta de pánico" : "alertas de pánico"} sin atender
                </span>
                <span className="block text-xs text-white/80">
                  {livePanic[0] ? `Última: ${livePanic[0].guardName}${livePanic[0].clientName ? ` · ${livePanic[0].clientName}` : ""}` : "Revisa y atiende de inmediato"}
                </span>
              </span>
              <span className="text-xs font-bold underline underline-offset-4">Atender</span>
            </button>
          )}

          <StatusStrip
            items={[
              {
                label: "Rondas activas",
                value: kpis.activeRounds,
                tone: kpis.activeRounds ? "brand" : "neutral",
                note: kpis.stalledRounds ? `${kpis.stalledRounds} ${kpis.stalledRounds === 1 ? "estancada" : "estancadas"}` : undefined,
                noteTone: kpis.stalledRounds ? "down" : "neutral",
                onClick: () => navigate("/rounds"),
              },
              {
                label: "Personal en turno",
                value: kpis.guardsOnShift,
                tone: kpis.guardsOnShift ? "info" : "neutral",
                note: `${onlineGuards.length} en línea`,
                onClick: () => navigate("/guards"),
              },
              {
                label: "Incidencias abiertas",
                value: kpis.openIncidents,
                tone: kpis.openIncidents ? "warning" : "neutral",
                note: kpis.openIncidents ? "por atender" : "sin pendientes",
                noteTone: kpis.openIncidents ? "down" : "neutral",
                onClick: () => navigate("/incidents"),
              },
              {
                label: "Cobertura de rutas",
                value: `${kpis.routesCovered}/${kpis.routesTotal}`,
                tone: routesPercent !== null && routesPercent < 100 ? "info" : "neutral",
                note: routesPercent === null ? "sin rutas" : `${routesPercent}%`,
                onClick: () => navigate("/routes"),
              },
              {
                label: "Entregas del turno",
                value: percentLabel(kpis.handoverCompliance),
                tone: kpis.handoverCompliance !== null && kpis.handoverCompliance < 90 ? "accent" : "neutral",
                note: `${live.compliance.handover.done}/${live.compliance.handover.total}`,
                onClick: () => navigate("/shift-planning"),
              },
              {
                label: "Uniformes del turno",
                value: percentLabel(kpis.uniformCompliance),
                tone: kpis.uniformCompliance !== null && kpis.uniformCompliance < 90 ? "success" : "neutral",
                note: `${live.compliance.uniform.done}/${live.compliance.uniform.total}`,
                onClick: () => navigate("/shift-planning"),
              },
            ]}
          />

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
            <Panel
              title="Alertas operativas"
              accent="danger"
              icon={<FaExclamationTriangle size={13} />}
              badge={<Counter value={live.alerts.length} tone={live.alerts.length ? "danger" : "neutral"} />}
              className={hasCompliance ? "xl:col-span-2" : "xl:col-span-3"}
            >
              <LiveAlertsPanel alerts={live.alerts} />
            </Panel>

            {hasCompliance && (
              <Panel
                title="Cumplimiento del turno"
                accent="success"
                icon={<FaCalendarCheck size={13} />}
                action={
                  <ITButton variant="text" color="primary" size="sm" onClick={() => navigate("/shift-planning")}>
                    Agenda
                  </ITButton>
                }
              >
                <CompliancePanel compliance={live.compliance} canRegister={canRegister} />
              </Panel>
            )}
          </div>

          {nothingPlanned && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary-100 bg-white px-5 py-3.5 dark:border-secondary-800 dark:bg-secondary-900">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-50 text-secondary-400 ring-1 ring-secondary-100 dark:bg-secondary-800 dark:ring-secondary-700">
                  <FaCalendarCheck size={13} />
                </span>
                <ITText className="text-[12px] font-bold text-secondary-600 dark:text-secondary-300">
                  Sin turnos programados
                  <span className="ml-1.5 font-medium text-secondary-400">— el cumplimiento se mide cuando programas entregas y uniformes.</span>
                </ITText>
              </div>
              <ITButton variant="outlined" color="primary" size="sm" onClick={() => navigate("/shift-planning")}>
                <span className="px-1 text-[10px] font-black uppercase tracking-wider">Programar turnos</span>
              </ITButton>
            </div>
          )}

          {(hasRounds || hasMap) && (
            <div className={`grid grid-cols-1 items-start gap-4 ${hasMap ? "xl:grid-cols-2" : ""}`}>
              {hasRounds && (
                <Panel
                  title="Rondas activas"
                  accent="success"
                  icon={<FaRoute size={13} />}
                  badge={<Counter value={live.activeRounds.filter((r) => r.state !== "ABANDONED").length} />}
                >
                  <ActiveRoundsPanel rounds={live.activeRounds} uncoveredRoutes={live.uncoveredRoutes} />
                </Panel>
              )}

              {hasMap && (
                <Panel title="Última ubicación conocida" accent="info" icon={<FaMapMarkerAlt size={13} />}>
                  <LiveMap points={live.mapPoints} height={360} />
                </Panel>
              )}
            </div>
          )}

          <Panel
            title={bottomTab === "staff" ? "Personal en turno" : "Actividad reciente"}
            accent={bottomTab === "staff" ? "info" : "accent"}
            icon={bottomTab === "staff" ? <FaUsers size={13} /> : <FaClock size={13} />}
            badge={
              bottomTab === "staff" ? (
                <ITText className="text-[11px] font-black tabular-nums text-secondary-400">
                  {onlineGuards.length}/{scopedGuards.length}
                </ITText>
              ) : (
                <Counter value={scopedActivity.length} />
              )
            }
            action={
              <div className="flex items-center gap-1 rounded-full border border-secondary-200 bg-secondary-50 p-0.5 dark:border-secondary-700 dark:bg-secondary-800">
                {(
                  [
                    { id: "staff", label: "Personal" },
                    { id: "activity", label: "Actividad" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBottomTab(tab.id)}
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] transition-colors ${
                      bottomTab === tab.id ? "bg-white text-secondary-800 shadow-sm dark:bg-secondary-900 dark:text-secondary-100" : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {bottomTab === "staff" ? (
                scopedGuards.length === 0 ? (
                  <ITText className="py-8 text-center text-sm text-secondary-400">Sin personal registrado</ITText>
                ) : (
                  scopedGuards.map((g) => <ActiveGuardRow key={g.id} guard={g} />)
                )
              ) : scopedActivity.length === 0 ? (
                <ITText className="py-8 text-center text-sm text-secondary-400">Los eventos del sistema se mostrarán aquí</ITText>
              ) : (
                scopedActivity.map((item) => <ActivityItemRow key={`${item.type}-${item.id}`} item={item} />)
              )}
            </div>
          </Panel>
        </>
      )}
    </ITPage>
  );
};

export default DashboardPage;
