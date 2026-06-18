import { ITMediaGrid } from "@app/core/components/ITMediaGrid";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaMapMarkedAlt,
  FaPlay,
  FaQrcode,
  FaRoute,
  FaStopwatch,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";

const API_BASE_URL = "http://localhost:4444";

const RoundDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  const [data, setData] = useState<IRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeTitle, setRouteTitle] = useState("");

  const metrics = useMemo(() => {
    if (!data) return null;

    const start = new Date(data.round.startTime);
    const end = data.round.endTime
      ? new Date(data.round.endTime)
      : data.round.status === "COMPLETED"
        ? new Date()
        : null;
    const effectiveEnd = end || new Date();

    const durationMs = effectiveEnd.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    const scans = data.timeline
      .filter((e) => e.type === "SCAN")
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const visitedLocations = new Set<string>();
    const coveredLocations = new Set<string>();

    const mapNodes: any[] = [];
    let previousTime = start;

    mapNodes.push({
      type: "START",
      label: "Inicio",
      status: "START",
      timeDiff: null,
    });

    scans.forEach((scan) => {
      const current = new Date(scan.timestamp);
      const diff = current.getTime() - previousTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const locId = String(scan.data?.location?.id);
      const isDuplicate = visitedLocations.has(locId);
      visitedLocations.add(locId);

      const hasEvidence =
        scan.data?.media &&
        Array.isArray(scan.data.media) &&
        scan.data.media.length > 0;

      let status = hasEvidence ? "SUCCESS" : "INCOMPLETE";

      if (isDuplicate && hasEvidence) {
        const alreadyHadSuccess = mapNodes.some(
          (n) =>
            n.label === scan.data?.location?.name && n.status === "SUCCESS",
        );
        if (alreadyHadSuccess) status = "DUPLICATE";
      }

      if (status === "SUCCESS") {
        coveredLocations.add(locId);
      }

      mapNodes.push({
        type: "POINT",
        label: scan.data?.location?.name || "Punto",
        status,
        timeDiff: `${mins}m ${secs}s`,
        diffMs: diff,
      });
      previousTime = current;
    });

    const validScansCount = coveredLocations.size;

    const expectedLocs =
      data.round.recurringConfiguration?.recurringLocations ||
      data.round.client?.locations?.map((l: any) => ({ location: l })) ||
      [];
    const missingLocs = expectedLocs.filter(
      (l: any) => !visitedLocations.has(String(l.location.id)),
    );

    missingLocs.forEach((loc: any) => {
      mapNodes.push({
        type: "POINT",
        label: loc.location.name,
        status: data.round.status === "COMPLETED" ? "MISSING" : "PENDING",
        timeDiff: "--",
        diffMs: 0,
      });
    });

    if (data.round.endTime) {
      const current = new Date(data.round.endTime);
      const diff = current.getTime() - previousTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      mapNodes.push({
        type: "END",
        label: "Fin",
        status: "END",
        timeDiff: `${mins}m ${secs}s`,
      });
    }

    const avgTime =
      scans.length > 0
        ? durationMs / (scans.length + (data.round.endTime ? 1 : 0))
        : 0;
    const avgMins = Math.floor(avgTime / 60000);
    const avgSecs = Math.floor((avgTime % 60000) / 1000);

    return {
      duration: `${durationMinutes}m ${durationSeconds}s`,
      totalScans: validScansCount,
      totalRawScans: scans.length,
      expectedScans: expectedLocs.length,
      mapNodes,
      avgTime: `${avgMins}m ${avgSecs}s`,
    };
  }, [data]);

  useEffect(() => {
    if (id) getData(id);
  }, [id]);

  const getData = async (roundId: string) => {
    setLoading(true);
    const res = await getRoundDetail(roundId);
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.round.recurringConfiguration) {
        setRouteTitle(res.data.round.recurringConfiguration.title);
      } else if (res.data.round.recurringConfigurationId) {
        getRoutesList().then((routesRes) => {
          if (routesRes.success && routesRes.data) {
            const match = routesRes.data.find(
              (r: any) => r.id === res.data.round.recurringConfigurationId,
            );
            if (match) setRouteTitle(match.title);
          }
        });
      }
    }
    setLoading(false);
  };

  const handleOpenRouteMap = () => {
    if (!data) return;
    const scansWithCoords = data.timeline
      .filter((e) => e.type === "SCAN" && e.data?.latitude && e.data?.longitude)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    if (scansWithCoords.length === 0) {
      dispatch(
        showToast({
          message: "No hay puntos con coordenadas GPS para trazar una ruta.",
          type: "warning",
        }),
      );
      return;
    }

    if (scansWithCoords.length === 1) {
      const url = `https://www.google.com/maps/search/?api=1&query=${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
      window.open(url, "_blank");
      return;
    }

    const origin = `${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
    const destination = `${scansWithCoords[scansWithCoords.length - 1].data.latitude},${scansWithCoords[scansWithCoords.length - 1].data.longitude}`;
    const waypoints = scansWithCoords
      .slice(1, -1)
      .map((s) => `${s.data.latitude},${s.data.longitude}`)
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, "_blank");
  };

  if (loading)
    return (
      <div className="min-h-screen   flex flex-col items-center justify-center space-y-4">
        <ITLoader />
        <p className="text-xs text-slate-400 font-light">
          Sincronizando ruta...
        </p>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen   flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-[32px] shadow-xl p-12 max-w-md border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <FaExclamationTriangle className="text-rose-500 text-3xl" />
          </div>
          <h3 className="text-base font-medium text-slate-800 mb-2">
            Ronda no encontrada
          </h3>
          <p className="text-[10px] text-slate-400 font-light mb-8">
            El registro solicitado no existe o fue removido.
          </p>
          <ITButton
            onClick={() => navigate(-1)}
            size="small"
          >
            <div className="flex items-center gap-1">
              <FaArrowLeft size={14} />
              <span className="text-[10px]">Volver al historial</span>
            </div>
          </ITButton>
        </div>
      </div>
    );

  const title =
    routeTitle ||
    data.round.recurringConfiguration?.title ||
    `Ronda #${data.round.id}`;

  return (
    <div className="min-h-screen   pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-sky-500 group-hover:text-white flex items-center justify-center transition-all text-slate-400 border border-slate-100 group-hover:border-sky-400 shadow-sm">
              <FaArrowLeft size={14} />
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-sky-600 transition-colors font-light">
              Volver
            </span>
          </button>

          <div className="flex items-center gap-3">
            <ITButton
              onClick={() => {
                const token = localStorage.getItem("token");
                window.open(
                  `${import.meta.env.VITE_BASE_URL}/rounds/${id}/report?token=${token}`,
                  "_blank",
                );
              }}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px]">Exportar PDF</span>
              </div>
            </ITButton>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-medium tracking-wide border shadow-sm ${
              data.round.status === "COMPLETED"
                ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}>
              {data.round.status === "COMPLETED" ? "COMPLETADA" : "EN CURSO"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-sm">
                <FaRoute size={20} />
              </div>
              <h1 className="text-3xl md:text-4xl font-medium text-slate-800">
                {title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-6">
              <HeaderMetric
                icon={<FaUserShield className="text-blue-500" />}
                label="Guardia"
                value={`${data.round.guard.name} ${data.round.guard.lastName}`}
              />
              <HeaderMetric
                icon={<FaBuilding className="text-slate-500" />}
                label="Cliente"
                value={data.round.client?.name || "Sin Cliente"}
              />
              <HeaderMetric
                icon={<FaCalendarAlt className="text-emerald-500" />}
                label="Fecha"
                value={dayjs(data.round.startTime).format("DD/MM/YYYY")}
              />
            </div>
          </div>
        </div>

        {/* Dash Cards */}
        {metrics && (
          <div
            className={`grid grid-cols-1 ${isResident ? "md:grid-cols-2" : "md:grid-cols-3"} gap-6`}
          >
            <MetricCard
              icon={<FaClock />}
              color="indigo"
              label="Duración Total"
              value={metrics.duration}
              subValue="Tiempo efectivo de recorrido"
            />
            <MetricCard
              icon={<FaQrcode />}
              color="emerald"
              label="Puntos Cubiertos"
              value={`${metrics.totalScans} / ${metrics.expectedScans || metrics.totalRawScans}`}
              subValue="Progreso de la ruta"
            />
            {!isResident && (
              <MetricCard
                icon={<FaStopwatch />}
                color="amber"
                label="Promedio por Punto"
                value={metrics.avgTime}
                subValue="Ritmo operativo detectado"
              />
            )}
          </div>
        )}

        {/* Visual Route Visualizer */}
        {metrics && (
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-sm">
                  <FaMapMarkedAlt size={22} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-slate-800">
                    Esquema de Recorrido
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Visualización secuencial de la ruta
                  </p>
                </div>
              </div>
              <ITButton
                onClick={handleOpenRouteMap}
                size="small"
                className="px-5 whitespace-nowrap shadow shadow-slate-100"
              >
                <div className="flex items-center gap-1">
                  <FaMapMarkedAlt size={14} className="text-sky-500" />
                  <span className="text-[10px]">Trazar en Google Maps</span>
                </div>
              </ITButton>
            </div>

            <div className="overflow-x-auto pb-6 scrollbar-hide">
              <div className="flex items-start min-w-max px-4">
                {metrics.mapNodes.map((node: any, idx: number) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && (
                      <div className="flex flex-col items-center mx-4">
                        <div className="w-16 h-1 bg-slate-100 rounded-full relative overflow-hidden">
                          {node.diffMs > 0 && (
                            <div className="absolute inset-0 bg-sky-500/20" />
                          )}
                        </div>
                          {!isResident &&
                            node.timeDiff &&
                            node.timeDiff !== "--" && (
                              <span className="text-[9px] text-slate-400 font-light mt-2 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">
                                {node.timeDiff}
                              </span>
                            )}
                      </div>
                    )}
                    <div className="flex flex-col items-center w-32 group">
                      <div
                        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 border-4 border-white
                          ${node.status === "START" ? "bg-sky-500 text-white shadow-sky-200" : ""}
                          ${node.status === "END" ? "bg-slate-800 text-white shadow-slate-300" : ""}
                          ${node.status === "SUCCESS" ? "bg-emerald-500 text-white shadow-emerald-200" : ""}
                          ${node.status === "DUPLICATE" ? "bg-rose-500 text-white shadow-rose-200" : ""}
                          ${node.status === "INCOMPLETE" ? "bg-amber-500 text-white shadow-amber-200" : ""}
                          ${node.status === "MISSING" ? "bg-rose-50 text-rose-500 border-rose-100 shadow-none" : ""}
                          ${node.status === "PENDING" ? "bg-slate-50 text-slate-300 border-slate-100 shadow-none" : ""}
                        `}
                      >
                        {node.status === "START" && (
                          <FaPlay size={18} className="ml-1" />
                        )}
                        {node.status === "END" && <FaCheckCircle size={22} />}
                        {node.status === "SUCCESS" && (
                          <FaCheckCircle size={22} />
                        )}
                        {node.status === "DUPLICATE" && (
                          <span className="font-medium text-2xl">!</span>
                        )}
                        {node.status === "INCOMPLETE" && (
                          <FaExclamationTriangle size={20} />
                        )}
                        {node.status === "MISSING" && (
                          <span className="font-medium text-xl">?</span>
                        )}
                        {node.status === "PENDING" && <FaClock size={20} />}
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-[10px] font-medium text-slate-700 leading-tight line-clamp-2">
                          {node.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Refined */}
        <div className="space-y-8">
          <div className="ml-2">
            <h2 className="text-base font-medium text-slate-800">
              Expediente de Tiempo
            </h2>
          </div>

          <div className="relative border-l-2 border-slate-100 ml-6 space-y-12 pb-10">
            {data.timeline.map((event, index) => (
              <div
                key={index}
                className="relative pl-12 animate-in fade-in slide-in-from-left-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TimelineIcon type={event.type} />

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 group overflow-hidden relative">
                  <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] text-slate-400 font-light">
                          {dayjs(event.timestamp).format("HH:mm:ss [HRS]")}
                        </span>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-[9px] text-slate-400 font-light">
                          {dayjs(event.timestamp).format("DD MMMM, YYYY")}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-slate-800 group-hover:text-slate-600 transition-colors">
                        {event.description}
                      </h3>
                      {event.type === "SCAN" && event.data?.assignment?.tasks?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.data.assignment.tasks.map((task: any) => (
                            <span
                              key={task.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] border ${
                                task.completed
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {task.completed ? (
                                <FaCheckCircle size={10} className="text-emerald-500" />
                              ) : (
                                <FaCircle size={10} className="text-amber-400" />
                              )}
                              {task.description}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {event.type === "SCAN" && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Evidence Column */}
                        <div className="space-y-6">
                          <div className="ml-1">
                            <p className="text-[10px] text-slate-400 font-light">
                              Registros de Campo
                            </p>
                          </div>
                          {event.data?.media?.length > 0 ? (
                            <ITMediaGrid
                              media={event.data.media}
                              gridSize={240}
                            />
                          ) : (
                            <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                              <FaFileAlt className="text-slate-200 text-3xl mb-3" />
                              <p className="text-[10px] text-slate-300 font-light">
                                Sin evidencia fotográfica
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Location/Map Column */}
                        <div className="space-y-6">
                          <div className="ml-1">
                            <p className="text-[10px] text-slate-400 font-light">
                              Geoposicionamiento
                            </p>
                          </div>
                          {event.data?.latitude ? (
                            <div className="rounded-[24px] overflow-hidden border border-slate-100 shadow-sm">
                              <GoogleMapComponent
                                lat={Number(event.data.latitude)}
                                lng={Number(event.data.longitude)}
                                height="240px"
                                zoom={18}
                              />
                            </div>
                          ) : (
                            <div className="h-[240px] bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-center">
                              <p className="text-[10px] text-slate-300 font-light">
                                GPS no disponible
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {event.data?.notes && (
                        <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <p className="text-xs text-slate-400 font-light">
                              Observaciones
                            </p>
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                              <p className="text-xs text-slate-600 font-light italic leading-relaxed">
                                "{event.data.notes}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {event.type === "INCIDENT" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-rose-500 px-3 py-1 rounded-full border border-rose-200 bg-rose-50">
                            INCIDENTE: {event.data?.category}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {event.data?.description}
                        </p>
                        {event.data?.media?.length > 0 && (
                          <ITMediaGrid
                            media={event.data.media.map((m: any) => ({
                              ...m,
                              url: m.url.startsWith("http")
                                ? m.url
                                : `${API_BASE_URL}${m.url.replace("/api/v1", "")}`,
                            }))}
                            gridSize={240}
                          />
                        )}
                      </div>
                      <div>
                        {event.data?.latitude && (
                          <div className="rounded-[24px] overflow-hidden border-2 border-rose-100 shadow-sm">
                            <GoogleMapComponent
                              lat={Number(event.data.latitude)}
                              lng={Number(event.data.longitude)}
                              height="300px"
                              zoom={18}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeaderMetric = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-light text-slate-400">
        {label}
      </p>
      <p className="text-[11px] font-medium text-slate-700">
        {value}
      </p>
    </div>
  </div>
);

const MetricCard = ({ icon, color, label, value, subValue }: any) => {
  const colors: any = {
    indigo: "from-sky-500 to-sky-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="space-y-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-sm`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-light text-slate-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-medium text-slate-800">
            {value}
          </p>
          <p className="text-[9px] text-slate-400 font-light mt-1">
            {subValue}
          </p>
        </div>
      </div>
    </div>
  );
};

const TimelineIcon = ({ type }: { type: string }) => {
  const styles: any = {
    START: {
      bg: "bg-sky-500",
      icon: <FaPlay className="ml-1" />,
      border: "border-sky-100",
    },
    SCAN: {
      bg: "bg-emerald-500",
      icon: <FaQrcode />,
      border: "border-emerald-100",
    },
    INCIDENT: {
      bg: "bg-rose-500",
      icon: <FaExclamationTriangle />,
      border: "border-rose-100",
    },
    END: {
      bg: "bg-slate-800",
      icon: <FaCheckCircle />,
      border: "border-slate-100",
    },
  };

  const config = styles[type] || {
    bg: "bg-slate-300",
    icon: null,
    border: "border-slate-50",
  };

  return (
    <div
      className={`absolute -left-[19px] top-0 w-9 h-9 rounded-xl ${config.bg} ${config.border} border-4 text-white flex items-center justify-center z-10 shadow-sm text-xs transition-transform group-hover:scale-110`}
    >
      {config.icon}
    </div>
  );
};

export default RoundDetailPage;