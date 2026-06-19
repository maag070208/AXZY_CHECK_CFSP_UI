import { ITBadget, ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FaBuilding, FaCalendarAlt, FaCheck, FaClock, FaExclamationTriangle, FaFileAlt, FaFolderOpen, FaGavel, FaTag, FaTimes, FaTrash, FaUser } from "react-icons/fa";
import { IGuardDiscipline } from "../services/GuardDisciplineService";

interface GuardDisciplineDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: IGuardDiscipline | null;
  onResolve: (id: string, status: "RESOLVED" | "DISMISSED", reason?: string) => void;
  onDelete: (record: IGuardDiscipline) => void;
  isAdmin: boolean;
  resolveLoading?: boolean;
}

const statusConfig: Record<string, { label: string; color: "warning" | "success" | "error"; icon: any }> = {
  PENDING: { label: "PENDIENTE", color: "warning", icon: FaExclamationTriangle },
  RESOLVED: { label: "RESUELTO", color: "success", icon: FaCheck },
  DISMISSED: { label: "DESESTIMADO", color: "error", icon: FaTimes },
};

const GuardDisciplineDetailDialog = ({
  isOpen,
  onClose,
  record,
  onResolve,
  onDelete,
  isAdmin,
  resolveLoading,
}: GuardDisciplineDetailDialogProps) => {
  const [resolveMode, setResolveMode] = useState<"RESOLVED" | "DISMISSED" | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setResolveMode(null);
    setReason("");
  }, [record?.id, isOpen]);

  if (!record) return null;

  const statusInfo = statusConfig[record.status];
  const StatusIcon = statusInfo.icon;

  const handleConfirmResolve = () => {
    if (resolveMode) {
      onResolve(record.id, resolveMode, reason);
    }
  };

  const handleCancelResolve = () => {
    setResolveMode(null);
    setReason("");
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Incidencia a Guardia"
      className="!max-w-[95vw] md:!max-w-[85vw] lg:!max-w-6xl !w-full"
    >
      <div className="flex flex-col max-h-[90vh] md:h-[85vh] w-full bg-gradient-to-br from-slate-50 to-white overflow-hidden">
        {/* Header con status */}
        <div className="flex-none px-4 md:px-8 py-3 md:py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${
                record.status === 'PENDING' ? 'bg-amber-50 text-amber-500' :
                record.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-500' :
                'bg-rose-50 text-rose-500'
              }`}>
                <StatusIcon size={24} />
              </div>
              <div>
                <h2 className="text-base md:text-xl font-semibold text-slate-800 truncate">{record.title}</h2>
                <p className="text-xs text-slate-400 font-light">ID: {record.id.slice(0, 8)}</p>
              </div>
            </div>
            <ITBadget color={statusInfo.color} label={statusInfo.label} />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            
            {/* Columna Principal - 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tarjeta de Descripción */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <FaFolderOpen className="text-slate-400" size={14} />
                    <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">Descripción</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {record.description || "Sin descripción detallada disponible."}
                  </p>
                </div>
              </div>

              {/* Metadata Tags */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {record.category && (
                  <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FaTag className="text-slate-400" size={12} />
                      <span className="text-[10px] text-slate-400 font-light">Categoría</span>
                    </div>
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full inline-block"
                      style={{
                        backgroundColor: record.category.color ? `${record.category.color}15` : "#F1F5F9",
                        color: record.category.color || "#475569",
                      }}
                    >
                      {record.category.name}
                    </span>
                  </div>
                )}
                
                {record.type && (
                  <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FaTag className="text-slate-400" size={12} />
                      <span className="text-[10px] text-slate-400 font-light">Tipo</span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full inline-block">
                      {record.type.name}
                    </span>
                  </div>
                )}
                
                {record.client && (
                  <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBuilding className="text-slate-400" size={12} />
                      <span className="text-[10px] text-slate-400 font-light">Sitio</span>
                    </div>
                    <span className="text-xs font-medium text-emerald-600">
                      {record.client.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Multimedia */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <FaFileAlt className="text-slate-400" size={14} />
                    <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">Archivos Adjuntos</h3>
                    {record.media && <span className="ml-auto text-xs text-slate-400">{record.media.length} archivos</span>}
                  </div>
                </div>
                <div className="p-6">
                  {record.media && record.media.length > 0 ? (
                    <ITMediaGrid
                      media={record.media.map((m) => ({ 
                        url: m.url, 
                        type: m.type === "photo" ? "IMAGE" : "VIDEO" as const 
                      }))}
                      title={record.title}
                      gridSize={180}
                    />
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-slate-300">
                      <FaFileAlt size={32} className="mb-3 opacity-20" />
                      <p className="text-xs text-slate-300 font-light">No hay archivos adjuntos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - 1/3 */}
            <div className="lg:col-span-1 space-y-4">
              {/* Guardia Involucrado */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-slate-400" size={14} />
                    <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">Guardia</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center text-lg font-medium shrink-0 shadow-lg">
                      {record.guard.name?.[0]}
                      {record.guard.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {record.guard.name} {record.guard.lastName}
                      </p>
                      <p className="text-xs font-light text-sky-500 truncate">@{record.guard.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">Información Temporal</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-500">
                      <FaCalendarAlt size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-light">Fecha de Creación</p>
                      <p className="text-sm font-medium text-slate-700">
                        {dayjs(record.createdAt).format("DD MMM YYYY")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-500">
                      <FaClock size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-light">Horario</p>
                      <p className="text-sm font-medium text-slate-700">
                        {dayjs(record.createdAt).format("HH:mm")} HRS
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Asignado por */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-medium text-slate-600 uppercase tracking-wider">Asignado por</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center text-base font-medium shrink-0 shadow-lg">
                      {record.createdBy.name?.[0]}
                      {record.createdBy.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {record.createdBy.name} {record.createdBy.lastName}
                      </p>
                      <p className="text-xs font-light text-sky-400 truncate">@{record.createdBy.username}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones - Solo para PENDING */}
              {record.status === "PENDING" && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="text-amber-500" size={14} />
                      <h3 className="text-xs font-medium text-amber-600 uppercase tracking-wider">Acción Requerida</h3>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {!resolveMode ? (
                      <>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Esta incidencia está pendiente de resolución. Selecciona una acción para continuar.
                        </p>
                        <ITButton
                          onClick={() => setResolveMode("RESOLVED")}
                          variant="filled"
                          color="success"
                          size="small"
                          className="w-full shadow shadow-emerald-200"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaCheck size={14} />
                            <span className="text-xs">Resolver Incidencia</span>
                          </div>
                        </ITButton>
                        <ITButton
                          onClick={() => setResolveMode("DISMISSED")}
                          variant="outlined"
                          color="error"
                          size="small"
                          className="w-full"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <FaGavel size={14} />
                            <span className="text-xs">Desestimar Incidencia</span>
                          </div>
                        </ITButton>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                          <div className={`p-2 rounded-xl ${
                            resolveMode === "RESOLVED" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                          }`}>
                            {resolveMode === "RESOLVED" ? <FaCheck size={16} /> : <FaExclamationTriangle size={16} />}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {resolveMode === "RESOLVED" ? "Resolver Incidencia" : "Desestimar Incidencia"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {resolveMode === "RESOLVED" ? "Marcar como resuelta" : "Desestimar la incidencia"}
                            </p>
                          </div>
                        </div>
                        <ITInput
                          type="textarea"
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Motivo (opcional)"
                          name="reason"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <ITButton
                            variant="filled"
                            color={resolveMode === "RESOLVED" ? "success" : "warning"}
                            size="small"
                            className="flex-1"
                            onClick={handleConfirmResolve}
                            disabled={resolveLoading}
                          >
                            {resolveLoading ? "Guardando..." : "Confirmar"}
                          </ITButton>
                          <ITButton
                            variant="ghost"
                            size="small"
                            onClick={handleCancelResolve}
                          >
                            <div className="flex items-center gap-1">
                              <FaTimes size={14} />
                              <span className="text-xs">Cancelar</span>
                            </div>
                          </ITButton>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Status banners para resolved/dismissed */}
              {record.status === "RESOLVED" && (
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <FaCheck size={60} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <FaCheck size={16} />
                      <p className="text-xs font-medium text-emerald-100">Resuelta</p>
                    </div>
                    <p className="text-[10px] text-emerald-100/80 font-light leading-relaxed">
                      Esta incidencia ha sido marcada como resuelta exitosamente.
                    </p>
                  </div>
                </div>
              )}

              {record.status === "DISMISSED" && (
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg shadow-rose-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <FaTimes size={60} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <FaTimes size={16} />
                      <p className="text-xs font-medium text-rose-100">Desestimada</p>
                    </div>
                    <p className="text-[10px] text-rose-100/80 font-light leading-relaxed">
                      Esta incidencia ha sido desestimada y no requiere acción adicional.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-between items-center px-4 md:px-8 py-3 md:py-4 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-light">Sistema de Disciplina</span>
          </div>
          <div className="flex items-center gap-3">
            <ITButton
              variant="ghost"
              size="small"
              className="px-4"
              onClick={() => {
                handleCancelResolve();
                onClose();
              }}
            >
              <div className="flex items-center gap-2">
                <FaTimes size={14} />
                <span className="text-xs">Cerrar</span>
              </div>
            </ITButton>

            {isAdmin && record.status === "PENDING" && (
              <ITButton
                variant="outlined"
                color="error"
                size="small"
                className="px-4"
                onClick={() => onDelete(record)}
              >
                <div className="flex items-center gap-2">
                  <FaTrash size={14} />
                  <span className="text-xs">Eliminar</span>
                </div>
              </ITButton>
            )}
          </div>
        </div>
      </div>
    </ITDialog>
  );
};

export default GuardDisciplineDetailDialog;