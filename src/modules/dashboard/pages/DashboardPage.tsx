import { ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  FaBell,
  FaExclamationTriangle,
  FaRoute,
  FaTools,
  FaUserShield,
  FaUsers,
  FaSync,
  FaClock,
} from "react-icons/fa";
import { AppState } from "@app/core/store/store";
import { useSelector } from "react-redux";
import { ActiveGuardRow } from "../components/ActiveGuardRow";
import { ActivityItemRow } from "../components/ActivityItemRow";
import { KpiCard } from "../components/KpiCard";

const ROLE_TONE_CLASS: Record<
  "emerald" | "violet" | "sky",
  { bg: string; text: string; ring: string; dot: string }
> = {
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-100",
    dot: "bg-emerald-500",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-100",
    dot: "bg-violet-500",
  },
  sky: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-100",
    dot: "bg-sky-500",
  },
};

const RolePill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "violet" | "sky";
}) => {
  const t = ROLE_TONE_CLASS[color];
  return (
    <div
      className={`flex flex-col items-center justify-center px-2 py-2.5 rounded-xl ring-1 ${t.bg} ${t.ring}`}
    >
      <span className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
        <span className={`text-[10px] font-black uppercase tracking-wider ${t.text}`}>
          {label}
        </span>
      </span>
      <span className={`text-2xl font-black tabular-nums leading-none ${t.text}`}>
        {value}
      </span>
    </div>
  );
};
import {
  getDashboardActiveGuards,
  getDashboardOverview,
  getDashboardPanicAlerts,
  getDashboardRecentActivity,
  IActiveGuard,
  IActivityItem,
  IDashboardOverview,
  IPanicAlertListItem,
} from "../services/DashboardService";

const formatGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const formatLongDate = (): string =>
  new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const DashboardPage = () => {
  const user = useSelector((state: AppState) => state.auth);
  const livePanicAlerts = useSelector(
    (state: AppState) => state.panic.liveAlerts,
  );
  const unreadPanicIds = useSelector(
    (state: AppState) => state.panic.unreadIds,
  );
  const activityEvents = useSelector(
    (state: AppState) => state.activity.events,
  );

  const [overview, setOverview] = useState<IDashboardOverview | null>(null);
  const [activeGuards, setActiveGuards] = useState<IActiveGuard[]>([]);
  const [activity, setActivity] = useState<IActivityItem[]>([]);
  const [serverPanicAlerts, setServerPanicAlerts] = useState<
    IPanicAlertListItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClient = user.role === "RESDN";

  const fetchAll = useCallback(async (silent: boolean = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const [ovRes, agRes, actRes, paRes] = await Promise.all([
        getDashboardOverview(),
        getDashboardActiveGuards(),
        getDashboardRecentActivity(20),
        getDashboardPanicAlerts(10),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (agRes.success && agRes.data) setActiveGuards(agRes.data);
      if (actRes.success && actRes.data) setActivity(actRes.data);
      if (paRes.success && paRes.data) setServerPanicAlerts(paRes.data);

      if (!ovRes.success || !agRes.success) {
        setError(
          ovRes.messages?.[0] ?? agRes.messages?.[0] ?? "Error al cargar",
        );
      }
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar el dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll(false);
  }, [fetchAll]);

  const lastEventIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activityEvents.length === 0) return;
    const latest = activityEvents[0];
    if (!latest || latest.id === lastEventIdRef.current) return;
    lastEventIdRef.current = latest.id;

    const type = latest.type;
    if (
      type === "incident" ||
      type === "maintenance" ||
      type === "discipline" ||
      type === "panic" ||
      type === "guard_status"
    ) {
      void fetchAll(true);
    }
  }, [activityEvents, fetchAll]);

  const mergedPanicAlerts = useMemo(() => {
    const ids = new Set(serverPanicAlerts.map((a) => a.id));
    const liveAsList: IPanicAlertListItem[] = livePanicAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.message,
      guardId: a.guardId,
      guardName: a.guardName,
      clientId: a.clientId,
      clientName: a.clientName,
      latitude: a.latitude,
      longitude: a.longitude,
      status: "PENDING",
      createdAt: new Date(a.receivedAt).toISOString(),
      resolvedAt: null,
    }));
    return [...liveAsList.filter((a) => !ids.has(a.id)), ...serverPanicAlerts];
  }, [serverPanicAlerts, livePanicAlerts]);

  const mergedActivity = useMemo(() => {
    if (livePanicAlerts.length === 0) return activity;
    const liveAsActivity: IActivityItem[] = livePanicAlerts.map((a) => ({
      id: a.id,
      type: "panic",
      title: a.title,
      guardId: a.guardId,
      guardName: a.guardName,
      clientId: a.clientId,
      clientName: a.clientName,
      status: "PENDING",
      latitude: a.latitude ?? undefined,
      longitude: a.longitude ?? undefined,
      createdAt: new Date(a.receivedAt).toISOString(),
    }));
    const liveIds = new Set(liveAsActivity.map((a) => a.id));
    return [...liveAsActivity, ...activity.filter((a) => !liveIds.has(a.id))];
  }, [activity, livePanicAlerts]);

  const onDutyByRole = useMemo(() => {
    const acc = { GUARD: 0, SHIFT: 0, MAINT: 0 };
    activeGuards.forEach((g) => {
      if (g.isLoggedIn) acc[g.role] += 1;
    });
    return acc;
  }, [activeGuards]);

  const sortedGuards = useMemo(() => {
    const order: Record<string, number> = { SHIFT: 0, GUARD: 1, MAINT: 2 };
    return [...activeGuards].sort((a, b) => {
      if (a.isLoggedIn !== b.isLoggedIn) return a.isLoggedIn ? -1 : 1;
      const ro = (order[a.role] ?? 9) - (order[b.role] ?? 9);
      if (ro !== 0) return ro;
      return a.name.localeCompare(b.name);
    });
  }, [activeGuards]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/40">
        <ITLoader size="lg" variant="spinner" color="primary" />
      </div>
    );
  }

  const counts = overview?.pendingCounts;
  const onlineGuardsCount = activeGuards.filter((g) => g.isLoggedIn).length;
  const liveUnreadCount = unreadPanicIds.length;
  const greeting = formatGreeting();
  const longDate = formatLongDate();

  return (
    <div className="min-h-screen bg-slate-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-emerald-600" />
              <ITText className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                Dashboard · Operaciones
              </ITText>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isClient ? "Vista de cliente" : "Centro de operaciones"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {greeting}
              {user.name ? `, ${user.name.split(" ")[0]}` : ""} · {longDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-xs font-bold text-emerald-700">
                <FaSync className="animate-spin" size={11} />
                Sincronizando
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <FaSync className={refreshing ? "animate-spin" : ""} size={12} />
              Refrescar
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* PANIC ALERTS BANNER */}
        {mergedPanicAlerts.length > 0 && (
          <section
            className={`rounded-2xl border p-5 ${
              liveUnreadCount > 0
                ? "border-rose-300 bg-rose-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <FaBell className="text-rose-600" size={16} />
                <h2 className="text-sm font-black uppercase tracking-widest text-rose-900">
                  Alertas de pánico
                </h2>
                {liveUnreadCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                    {liveUnreadCount} en vivo
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mergedPanicAlerts.slice(0, 4).map((a) => {
                const isLive = unreadPanicIds.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between p-3 rounded-lg bg-white border ${
                      isLive ? "border-rose-300" : "border-slate-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {a.guardName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {a.clientName ?? "—"} · {a.status}
                      </div>
                    </div>
                    {a.latitude != null && a.longitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 px-2.5 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 transition-colors flex-shrink-0"
                      >
                        Mapa
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* KPI CARDS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Indicadores clave
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tiempo real
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <KpiCard
              label="Personal en turno"
              value={overview?.activeBreakdown?.total ?? 0}
              icon={<FaUsers />}
              color="primary"
              subtitle={`${onlineGuardsCount} de ${overview?.totalGuards ?? 0}`}
            />
            <KpiCard
              label="Rondas activas"
              value={counts?.activeRounds ?? 0}
              icon={<FaRoute />}
              color="info"
            />
            <KpiCard
              label="Incidencias"
              value={counts?.incidents ?? 0}
              icon={<FaExclamationTriangle />}
              color="warning"
              pulse
            />
            <KpiCard
              label="Mantenimientos"
              value={counts?.maintenances ?? 0}
              icon={<FaTools />}
              color="info"
            />
            <KpiCard
              label="Disciplinas"
              value={counts?.disciplines ?? 0}
              icon={<FaUserShield />}
              color="purple"
            />
            <KpiCard
              label="Pánico"
              value={counts?.panicAlerts ?? 0}
              icon={<FaBell />}
              color="danger"
              pulse
            />
          </div>
        </section>

        {/* MAIN GRID: GUARDS + ACTIVITY */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ACTIVE GUARDS */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <FaUsers size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <ITText className="text-sm font-black uppercase tracking-widest text-slate-800">
                    Personal en turno
                  </ITText>
                  <ITText className="text-[11px] text-slate-500 font-semibold">
                    En operación ahora mismo
                  </ITText>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-black text-slate-900 tabular-nums leading-none tracking-tight">
                  {onlineGuardsCount}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  de {activeGuards.length} totales
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <RolePill
                  label="Guardias"
                  value={onDutyByRole.GUARD}
                  color="emerald"
                />
                <RolePill
                  label="Jefe turno"
                  value={onDutyByRole.SHIFT}
                  color="violet"
                />
                <RolePill
                  label="Mantto"
                  value={onDutyByRole.MAINT}
                  color="sky"
                />
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-2 max-h-[560px] overflow-y-auto">
              {sortedGuards.length === 0 ? (
                <EmptyState
                  icon={<FaUsers />}
                  title="Sin personal registrado"
                  subtitle="No hay personal activo en este momento"
                />
              ) : (
                sortedGuards.map((g) => <ActiveGuardRow key={g.id} guard={g} />)
              )}
            </div>
          </div>

          {/* ACTIVITY FEED */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_rgba(15,23,42,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-sm">
                  <FaClock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <ITText className="text-sm font-black uppercase tracking-widest text-slate-800">
                      Actividad reciente
                    </ITText>
                    {liveUnreadCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                        {liveUnreadCount} en vivo
                      </span>
                    )}
                  </div>
                  <ITText className="text-[11px] text-slate-500 font-semibold">
                    Bitácora de eventos operativos
                  </ITText>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">
                  {mergedActivity.length}
                </span>
                <ITText className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                  eventos
                </ITText>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-2 max-h-[640px] overflow-y-auto">
              {mergedActivity.length === 0 ? (
                <EmptyState
                  icon={<FaClock />}
                  title="Sin actividad reciente"
                  subtitle="Los eventos del sistema se mostrarán aquí"
                />
              ) : (
                mergedActivity.map((item) => (
                  <ActivityItemRow
                    key={`${item.type}-${item.id}`}
                    item={item}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const EmptyState = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-base mb-3">
      {icon}
    </div>
    <ITText className="text-sm font-bold text-slate-600">{title}</ITText>
    {subtitle && (
      <ITText className="text-xs text-slate-400 mt-1">{subtitle}</ITText>
    )}
  </div>
);

export default DashboardPage;
