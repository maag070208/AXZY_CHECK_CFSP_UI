import { ITMediaGrid } from "@app/core/components/ITMediaGrid";
import { ITBadget, ITButton, ITPage } from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaFilePdf,
  FaMapMarkedAlt,
  FaPlay,
  FaQrcode,
  FaRoute,
  FaStopwatch,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useRoundDetailPage } from "../model/useRoundDetailPage";
import dayjs from "dayjs";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import store from "@app/core/store/store";

const RoundDetailPage = () => {
  const navigate = useNavigate();
  const {
    data,
    loading,
    metrics,
    routeTitle,
    handleOpenRouteMap,
    primary,
    primaryLight,
    isResident,
    id,
  } = useRoundDetailPage();

  const statusBadge = data ? (
    <ITBadget color={data.round.status === "COMPLETED" ? "success" : "warning"} size="sm">
      {data.round.status === "COMPLETED" ? "COMPLETADA" : "EN CURSO"}
    </ITBadget>
  ) : null;

  const title = data
    ? routeTitle || data.round.recurringConfiguration?.title || `Ronda #${data.round.id}`
    : "Detalle de recorrido";

  const pageProps = {
    noPadding: true,
    title,
    icon: <FaRoute size={20} />,
    backAction: () => navigate(-1),
    breadcrumbs: [
      { label: "Inicio", onClick: () => navigate("/home") },
      { label: "Historial de recorridos", onClick: () => navigate("/rounds") },
      { label: title },
    ],
  };

  if (loading || !data)
    return (
      <ITPage
        {...pageProps}
        loading={loading}
        error={!loading && !data ? "El registro solicitado no existe o fue removido." : null}
        errorTitle="Ronda no encontrada"
        errorActionLabel="Volver al historial"
        onRetry={() => navigate("/rounds")}
      >
        {null}
      </ITPage>
    );

  return (
    <div style={{ "--p": primary, "--pl": primaryLight } as React.CSSProperties}>
      <ITPage
        {...pageProps}
        actions={
          <div className="flex items-center gap-3">
            <ITButton
              onClick={() => {
                const token = store.getState().auth.token;
                window.open(`${import.meta.env.VITE_BASE_URL}/rounds/${id}/report?token=${token}`, "_blank");
              }}
              size="sm"
            >
              <div className="flex items-center gap-1">
                <FaFilePdf size={14} className="text-white" />
                <span className="text-[10px]">Exportar PDF</span>
              </div>
            </ITButton>
            {statusBadge}
          </div>
        }
      >
      <div className="space-y-6 md:space-y-10 pb-20">
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
            <div className="bg-white rounded-[24px] md:rounded-[40px] p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 md:space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-(--pl) text-(--p) flex items-center justify-center border border-(--pl) shadow-sm">
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
                size="sm"
                className="px-5 whitespace-nowrap shadow shadow-slate-100"
              >
                <div className="flex items-center gap-1">
                  <FaMapMarkedAlt size={14} className="text-white" />
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
                            <div className="absolute inset-0 bg-[--pl]0/20" />
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
                          ${node.status === "START" ? "bg-(--p) text-white shadow-emerald-200" : ""}
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

                <div className="bg-white rounded-[20px] md:rounded-[32px] border border-slate-100 shadow-sm p-5 md:p-8 group overflow-hidden relative">
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
                      {event.type === "SCAN" && (event.data?.assignment?.tasks?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.data.assignment!.tasks!.map((task) => (
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
                          {(event.data?.media?.length ?? 0) > 0 ? (
                            <ITMediaGrid
                              media={(event.data.media ?? []).map((m) => ({ ...m, type: (m.type ?? "IMAGE").toUpperCase() as "IMAGE" | "VIDEO" }))}
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
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </ITPage>
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
    indigo: "from-(--p) to-emerald-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
      <div className="space-y-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-linear-to-br ${colors[color]} flex items-center justify-center text-white shadow-sm`}
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
      bg: "bg-[--pl]0",
      icon: <FaPlay className="ml-1" />,
      border: "border-(--pl)",
    },
    SCAN: {
      bg: "bg-emerald-500",
      icon: <FaQrcode />,
      border: "border-emerald-100",
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
      className={`absolute left-[-19px] top-0 w-9 h-9 rounded-xl ${config.bg} ${config.border} border-4 text-white flex items-center justify-center z-10 shadow-sm text-xs transition-transform group-hover:scale-110`}
    >
      {config.icon}
    </div>
  );
};

export default RoundDetailPage;