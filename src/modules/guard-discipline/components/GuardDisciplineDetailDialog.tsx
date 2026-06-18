import { ITBadget, ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import dayjs from "dayjs";
import { useState } from "react";
import { FaCheck, FaExclamationTriangle, FaFileAlt, FaGavel, FaTimes, FaTrash } from "react-icons/fa";
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

const statusConfig: Record<string, { label: string; color: "warning" | "success" | "error" }> = {
  PENDING: { label: "PENDIENTE", color: "warning" },
  RESOLVED: { label: "RESUELTO", color: "success" },
  DISMISSED: { label: "DESESTIMADO", color: "error" },
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

  if (!record) return null;

  const statusInfo = statusConfig[record.status];

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
      className="!max-w-[95vw] md:!max-w-[80vw] lg:!max-w-5xl !w-full"
    >
      <div className="flex flex-col h-[85vh] w-full bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Column */}
            <div className="lg:col-span-7 space-y-10">
              {/* Content Card */}
              <section>
                <div className="flex items-center justify-between mb-6">
                    <p className="text-xs text-slate-400 font-light">
                      Información General
                    </p>
                    <ITBadget color={statusInfo.color} label={statusInfo.label} />
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-medium text-slate-800">
                    {record.title}
                  </h3>

                  <div className="flex flex-wrap gap-8">
                    {record.category && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-light">
                          Categoría
                        </span>
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: (record.category.color || "#F1F5F9") + "20",
                            color: record.category.color || "#475569",
                          }}
                        >
                          {record.category.name}
                        </span>
                      </div>
                    )}
                    {record.type && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-light">
                          Tipo
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {record.type.name}
                        </span>
                      </div>
                    )}
                    {record.client && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-400 font-light">
                          Sitio
                        </span>
                        <span className="text-[11px] font-medium text-emerald-600">
                          {record.client.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap">
                      {record.description || "Sin descripción detallada disponible."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Multimedia */}
              <section>
                {record.media && record.media.length > 0 ? (
                  <ITMediaGrid
                    media={record.media.map((m) => ({ url: m.url, type: m.type === "photo" ? "IMAGE" : "VIDEO" as const }))}
                    title={record.title}
                    gridSize={220}
                  />
                ) : (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                    <FaFileAlt size={32} className="mb-3 opacity-10" />
                    <p className="text-[10px] text-slate-300 font-light">
                      Sin archivos adjuntos
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-5 space-y-6">
              {/* Guard info */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-light mb-4">
                  Guardia Involucrado
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-base font-medium shrink-0">
                    {record.guard.name?.[0]}
                    {record.guard.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {record.guard.name} {record.guard.lastName}
                    </p>
                    <p className="text-[10px] font-light text-sky-500 mt-0.5 truncate">
                      @{record.guard.username}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-light">
                      Fecha
                    </span>
                    <span className="text-[10px] font-medium text-slate-700">
                      {dayjs(record.createdAt).format("DD MMM YYYY")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-light">
                      Horario
                    </span>
                    <span className="text-[10px] font-medium text-slate-700">
                      {dayjs(record.createdAt).format("HH:mm")} HRS
                    </span>
                  </div>
                </div>
              </div>

              {/* Created by */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 font-light mb-4">
                  Asignado por
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center text-base font-medium shrink-0">
                    {record.createdBy.name?.[0]}
                    {record.createdBy.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {record.createdBy.name} {record.createdBy.lastName}
                    </p>
                    <p className="text-[10px] font-light text-sky-400 mt-0.5 truncate">
                      @{record.createdBy.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resolution status */}
              {record.status === "RESOLVED" && (
                <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <FaCheck size={60} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-xs text-emerald-100 font-light mb-2">
                      Incidencia Resuelta
                    </p>
                    <p className="text-[10px] text-emerald-100/80 font-light">
                      Esta incidencia ha sido marcada como resuelta.
                    </p>
                  </div>
                </div>
              )}

              {record.status === "DISMISSED" && (
                <div className="bg-rose-500 p-6 rounded-3xl text-white shadow-lg shadow-rose-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <FaFileAlt size={60} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-xs text-rose-100 font-light mb-2">
                      Incidencia Desestimada
                    </p>
                    <p className="text-[10px] text-rose-100/80 font-light">
                      Esta incidencia ha sido desestimada.
                    </p>
                  </div>
                </div>
              )}

              {/* Pending action */}
              {record.status === "PENDING" && !resolveMode && (
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 space-y-3">
                  <p className="text-xs text-rose-500 font-light">
                    Acción Requerida
                  </p>
                  <p className="text-[10px] text-rose-700 font-light leading-relaxed">
                    Esta incidencia disciplinaria está pendiente de resolución.
                  </p>
                  <ITButton
                    onClick={() => setResolveMode("RESOLVED")}
                    variant="filled"
                    color="success"
                    size="small"
                    className="w-full shadow shadow-emerald-200"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <FaCheck size={14} />
                      <span className="text-[10px]">Resolver Incidencia</span>
                    </div>
                  </ITButton>
                  <ITButton
                    onClick={() => setResolveMode("DISMISSED")}
                    variant="outlined"
                    color="error"
                    size="small"
                    className="w-full"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <FaGavel size={14} />
                      <span className="text-[10px]">Desestimar Incidencia</span>
                    </div>
                  </ITButton>
                </div>
              )}

              {resolveMode && (
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      resolveMode === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-500"
                        : "bg-amber-50 text-amber-500"
                    }`}>
                      {resolveMode === "RESOLVED" ? <FaCheck size={16} /> : <FaExclamationTriangle size={16} />}
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-slate-800">
                        {resolveMode === "RESOLVED" ? "Resolver Incidencia" : "Desestimar Incidencia"}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-light">
                        {resolveMode === "RESOLVED"
                          ? "La incidencia será marcada como resuelta"
                          : "La incidencia será desestimada"}
                      </p>
                    </div>
                  </div>
                  <ITInput
                    type="textarea"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Motivo"
                    name="reason"
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
                        <span className="text-[10px]">Cancelar</span>
                      </div>
                    </ITButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-end items-center px-8 py-6 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            variant="filled"
            color="secondary"
            size="small"
            className="px-5 whitespace-nowrap shadow shadow-slate-100"
            onClick={() => { handleCancelResolve(); onClose(); }}
          >
            <div className="flex items-center gap-1">
              <FaTimes size={14} />
              <span className="text-[10px]">Cerrar Visor</span>
            </div>
          </ITButton>

          {isAdmin && (
            <ITButton
              variant="outlined"
              color="error"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={() => onDelete(record)}
            >
              <div className="flex items-center gap-1">
                <FaTrash size={14} />
                <span className="text-[10px]">Eliminar Registro</span>
              </div>
            </ITButton>
          )}
        </div>
      </div>
    </ITDialog>
  );
};

export default GuardDisciplineDetailDialog;
