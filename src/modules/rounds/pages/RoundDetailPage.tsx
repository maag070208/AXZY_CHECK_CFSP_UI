import { MediaCarousel } from "@app/core/components/MediaCarousel";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaMapMarkedAlt,
  FaPlay,
  FaQrcode,
  FaRoute,
  FaStopwatch,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import {
  deleteIncident,
  deleteIncidentMedia,
} from "../../incidents/services/IncidentService";
import {
  deleteKardexEntry,
  deleteKardexMedia,
} from "../../kardex/services/KardexService";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";

const RoundDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const role = useSelector((state: AppState) => state.auth.role);
  const isAdmin = role === "ADMIN";

  const [data, setData] = useState<IRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeTitle, setRouteTitle] = useState("");

  const handleDeleteMedia = async (
    eventId: string,
    type: "SCAN" | "INCIDENT",
    item: any,
  ) => {
    const key = item.key || item.url.split("/").pop();
    if (!key) return;

    let res;
    if (type === "SCAN") {
      res = await deleteKardexMedia(eventId, key);
    } else {
      res = await deleteIncidentMedia(eventId, key);
    }

    if (res.success) {
      dispatch(
        showToast({
          message: "Archivo eliminado correctamente",
          type: "success",
        }),
      );
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          timeline: prev.timeline.map((e) => {
            const currentId = e.data?.id;
            if (currentId === eventId && e.type === type) {
              return {
                ...e,
                data: {
                  ...e.data,
                  media: e.data.media.filter(
                    (m: any) => (m.key || m.url.split("/").pop()) !== key,
                  ),
                },
              };
            }
            return e;
          }),
        };
      });
    }
  };

  const handleDeleteEvent = async (
    eventId: string,
    type: "SCAN" | "INCIDENT",
  ) => {
    if (!window.confirm("¿Deseas eliminar este registro permanentemente?"))
      return;

    let res;
    if (type === "SCAN") {
      res = await deleteKardexEntry(eventId);
    } else {
      res = await deleteIncident(eventId);
    }

    if (res.success) {
      dispatch(showToast({ message: "Registro eliminado", type: "success" }));
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          timeline: prev.timeline.filter(
            (e) => !(e.data?.id === eventId && e.type === type),
          ),
        };
      });
    }
  };

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
    let validScansCount = 0;

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

      if (status === "SUCCESS" && !isDuplicate) validScansCount++;

      mapNodes.push({
        type: "POINT",
        label: scan.data?.location?.name || "Punto",
        status,
        timeDiff: `${mins}m ${secs}s`,
        diffMs: diff,
      });
      previousTime = current;
    });

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

  // const handleShareWhatsApp = () => {
  //   if (!data) return;
  //   const token = localStorage.getItem("token");
  //   const reportUrl = `${import.meta.env.VITE_BASE_URL}/rounds/${id}/report?token=${token}`;
  //   const clientName =
  //     data.round.client?.name ||
  //     data.round.recurringConfiguration?.client?.name ||
  //     (data.round.guard as any)?.client?.name ||
  //     "Cliente";
  //   const guardName = `${data.round.guard.name} ${data.round.guard.lastName}`;
  //   const title =
  //     routeTitle ||
  //     data.round.recurringConfiguration?.title ||
  //     `Ronda #${data.round.id}`;

  //   const message =
  //     `*Reporte de Ronda - FANSAL*\n\n` +
  //     `*Ruta:* ${title}\n` +
  //     `*Cliente:* ${clientName}\n` +
  //     `*Guardia:* ${guardName}\n` +
  //     `*Fecha:* ${new Date(data.round.startTime).toLocaleDateString()}\n\n` +
  //     `Puedes ver el reporte detallado aquí:\n${reportUrl}`;

  //   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  //   window.open(whatsappUrl, "_blank");
  // };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <ITLoader />
          <p className="mt-4 text-slate-500 font-medium">
            Cargando detalles de la ronda...
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            No se encontró la ronda
          </h3>
          <p className="text-slate-500 mb-6">
            La ronda que buscas no existe o ha sido eliminada.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                <FaArrowLeft className="text-sm" />
              </div>
              <span className="font-medium hidden sm:inline">Volver</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Compartir por WhatsApp */}
              {/* <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-bold text-sm shadow-lg shadow-emerald-100"
              >
                <FaWhatsapp className="text-lg" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button> */}

              {/* Descargar PDF */}
              <button
                onClick={() => {
                  const token = localStorage.getItem("token");
                  window.open(
                    `${import.meta.env.VITE_BASE_URL}/rounds/${id}/report?token=${token}`,
                    "_blank",
                  );
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm border border-slate-200 shadow-sm"
              >
                <FaFileAlt className="text-emerald-500" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <ITBadget
                color={
                  data.round.status === "COMPLETED" ? "success" : "warning"
                }
                variant="filled"
                size="medium"
              >
                {data.round.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
              </ITBadget>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            {routeTitle ||
              data.round.recurringConfiguration?.title ||
              `Ronda #${data.round.id}`}
          </h1>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FaUserShield className="text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Guardia</p>
                <p className="font-semibold text-slate-700">
                  {data.round.guard.name} {data.round.guard.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <FaBuilding className="text-slate-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Cliente</p>
                <p className="font-semibold text-slate-700">
                  {data.round.client?.name ||
                    data.round.recurringConfiguration?.client?.name ||
                    (data.round.guard as any)?.client?.name ||
                    "Sin Cliente"}
                </p>
              </div>
            </div>

            {data.round.recurringConfiguration?.startTime && (
              <div className="flex items-center gap-2 text-slate-600">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <FaClock className="text-purple-600 text-sm" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Horario programado</p>
                  <p className="font-semibold text-slate-700">
                    {data.round.recurringConfiguration.startTime} -{" "}
                    {data.round.recurringConfiguration.endTime}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <FaCalendarAlt className="text-emerald-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Fecha de inicio</p>
                <p className="font-semibold text-slate-700">
                  {new Date(data.round.startTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FaClock className="text-white text-xl" />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Duración Total
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {metrics.duration}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FaQrcode className="text-white text-xl" />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Puntos Cubiertos
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {metrics.totalScans}{" "}
                <span className="text-sm text-slate-400 font-normal">
                  /{" "}
                  {metrics.expectedScans > 0
                    ? metrics.expectedScans
                    : metrics.totalRawScans}
                </span>
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <FaStopwatch className="text-white text-xl" />
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Promedio tramo
              </p>
              <p className="text-2xl font-bold text-slate-800">
                {metrics.avgTime}
              </p>
            </div>
          </div>
        )}

        {/* Ruta Recorrida Visual */}
        {metrics && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <FaRoute className="text-white text-lg" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">
                  Ruta Recorrida
                </h3>
              </div>
              <button
                onClick={handleOpenRouteMap}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all"
              >
                <FaMapMarkedAlt className="text-blue-600" /> Ver en mapa
              </button>
            </div>
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start min-w-max">
                {metrics.mapNodes.map((node: any, idx: number) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && (
                      <div className="flex flex-col items-center mx-2">
                        {node.timeDiff && node.timeDiff !== "--" && (
                          <span className="text-xs font-mono text-slate-500 mb-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                            {node.timeDiff}
                          </span>
                        )}
                        <div className="w-12 h-0.5 bg-gradient-to-r from-slate-300 to-slate-400"></div>
                      </div>
                    )}
                    <div className="flex flex-col items-center w-28 group">
                      <div
                        className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110
                                                ${node.status === "START" ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-300" : ""}
                                                ${node.status === "END" ? "bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-300" : ""}
                                                ${node.status === "SUCCESS" ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-300" : ""}
                                                ${node.status === "DUPLICATE" ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-300" : ""}
                                                ${node.status === "INCOMPLETE" ? "bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-300" : ""}
                                                ${node.status === "MISSING" ? "bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300" : ""}
                                                ${node.status === "PENDING" ? "bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300" : ""}
                                            `}
                      >
                        {node.status === "START" && (
                          <FaPlay className="text-white text-lg ml-0.5" />
                        )}
                        {node.status === "END" && (
                          <FaCheckCircle className="text-white text-lg" />
                        )}
                        {node.status === "SUCCESS" && (
                          <FaCheckCircle className="text-white text-lg" />
                        )}
                        {node.status === "DUPLICATE" && (
                          <span className="text-white text-2xl font-bold">
                            !
                          </span>
                        )}
                        {node.status === "INCOMPLETE" && (
                          <FaExclamationTriangle className="text-white text-lg" />
                        )}
                        {node.status === "MISSING" && (
                          <span className="text-red-600 text-xl font-bold">
                            ?
                          </span>
                        )}
                        {node.status === "PENDING" && (
                          <FaClock className="text-slate-500 text-lg" />
                        )}
                      </div>
                      <p className="text-center text-sm font-semibold mt-3 text-slate-700 leading-tight">
                        {node.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">
              Línea de tiempo
            </h2>
          </div>
          <div className="p-6">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
              {data.timeline.map((event, index) => (
                <div key={index} className="relative pl-8">
                  <EventIcon type={event.type} />
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      {isAdmin &&
                        (event.type === "INCIDENT" ||
                          event.type === "SCAN") && (
                          <button
                            onClick={() =>
                              handleDeleteEvent(
                                event.data.id,
                                event.type as any,
                              )
                            }
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                    </div>
                    <h3 className="text-md font-bold text-slate-700 mb-3">
                      {event.description}
                    </h3>

                    {event.type === "SCAN" && (
                      <div className="space-y-4">
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2">
                          <FaBuilding className="text-purple-600" />
                          <p className="font-bold text-slate-800">
                            {event.data?.location?.name}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            {event.data?.media?.length > 0 ? (
                              <MediaCarousel
                                media={event.data.media}
                                title="Evidencia"
                                showDelete={isAdmin}
                                onDelete={(item) =>
                                  handleDeleteMedia(event.data.id, "SCAN", item)
                                }
                              />
                            ) : (
                              <p className="text-sm text-slate-400 italic">
                                Sin evidencia fotográfica
                              </p>
                            )}
                          </div>
                          {event.data?.latitude && (
                            <GoogleMapComponent
                              lat={Number(event.data.latitude)}
                              lng={Number(event.data.longitude)}
                              height="200px"
                              zoom={18}
                            />
                          )}
                        </div>
                        {event.data?.notes && (
                          <NotesViewer notes={event.data.notes} />
                        )}
                        {event.data?.assignment?.tasks && (
                          <TaskList tasks={event.data.assignment.tasks} />
                        )}
                      </div>
                    )}

                    {event.type === "INCIDENT" && (
                      <div className="space-y-4">
                        <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 font-bold text-orange-700">
                          {event.data?.category}
                        </div>
                        <p className="text-sm text-slate-600">
                          {event.data?.description}
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {event.data?.media?.length > 0 && (
                            <MediaCarousel
                              media={event.data.media}
                              title="Incidente"
                              showDelete={isAdmin}
                              onDelete={(item) =>
                                handleDeleteMedia(
                                  event.data.id,
                                  "INCIDENT",
                                  item,
                                )
                              }
                            />
                          )}
                          {event.data?.latitude && (
                            <GoogleMapComponent
                              lat={Number(event.data.latitude)}
                              lng={Number(event.data.longitude)}
                              height="200px"
                              zoom={18}
                            />
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
    </div>
  );
};

// --- Subcomponentes de apoyo ---

const EventIcon = ({ type }: { type: string }) => {
  let icon = <div className="w-2 h-2 rounded-full bg-slate-300" />;
  let bg = "bg-slate-100",
    border = "border-slate-300";
  if (type === "START") {
    icon = <FaPlay className="text-blue-600 text-xs" />;
    bg = "bg-blue-100";
    border = "border-blue-500";
  }
  if (type === "SCAN") {
    icon = <FaQrcode className="text-purple-600 text-xs" />;
    bg = "bg-purple-100";
    border = "border-purple-500";
  }
  if (type === "INCIDENT") {
    icon = <FaExclamationTriangle className="text-orange-600 text-xs" />;
    bg = "bg-orange-100";
    border = "border-orange-500";
  }
  if (type === "END") {
    icon = <FaCheckCircle className="text-green-600 text-xs" />;
    bg = "bg-green-100";
    border = "border-green-500";
  }
  return (
    <div
      className={`absolute -left-[13px] top-0 w-7 h-7 rounded-full ${bg} border-2 ${border} flex items-center justify-center z-10 shadow-sm`}
    >
      {icon}
    </div>
  );
};

const NotesViewer = ({ notes }: { notes: string }) => {
  if (!notes) return null;
  const lines = notes.split("\n");
  return (
    <div className="space-y-2 bg-white rounded-xl p-4 border border-slate-200">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("---"))
          return <div key={i} className="border-t border-slate-200 my-2" />;
        if (trimmed.startsWith("[ ]") || trimmed.startsWith("[x]")) {
          const isChecked = trimmed.startsWith("[x]");
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}
              >
                {isChecked && <FaCheckCircle size={10} />}
              </div>
              <span
                className={
                  isChecked ? "text-slate-400 line-through" : "text-slate-700"
                }
              >
                {trimmed.replace(/\[.\]/, "").trim()}
              </span>
            </div>
          );
        }
        return (
          trimmed && (
            <p key={i} className="text-sm text-slate-600 italic">
              "{trimmed}"
            </p>
          )
        );
      })}
    </div>
  );
};

const TaskList = ({ tasks }: { tasks: any[] }) => {
  if (!tasks || tasks.length === 0) return null;
  return (
    <div className="space-y-2">
      {tasks.map((task, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-lg text-sm"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center ${task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}
          >
            {task.completed && <FaCheckCircle size={10} />}
          </div>
          <span
            className={
              task.completed ? "text-slate-400 line-through" : "text-slate-700"
            }
          >
            {task.description}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RoundDetailPage;
