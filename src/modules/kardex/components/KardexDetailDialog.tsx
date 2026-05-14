import { ITBadget, ITButton, ITDialog } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import { translateScanType } from "@core/utils/status.utils";
import dayjs from "dayjs";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaMapMarkerAlt,
  FaSync,
} from "react-icons/fa";
import { KardexEntry } from "../services/KardexService";

interface KardexDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: KardexEntry | null;
}

const KardexDetailDialog = ({
  isOpen,
  onClose,
  entry,
}: KardexDetailDialogProps) => {
  if (!entry) return null;

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Marcaje"
      className="!max-w-[95vw] md:!max-w-[80vw] lg:!max-w-5xl !w-full"
    >
      <div className="flex flex-col h-[85vh] w-full bg-white overflow-hidden">
        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Columna Principal - Contenido */}
            <div className="lg:col-span-7 space-y-10">
              {/* Información del Guardia / Responsable */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Información del Responsable
                    </h4>
                  </div>
                  <ITBadget
                    color={
                      entry.scanType === "ASSIGNMENT" ? "success" : "warning"
                    }
                    variant="outlined"
                    className="font-black text-[9px] tracking-[0.2em]"
                    label={translateScanType(entry.scanType)}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[32px] bg-slate-50 text-slate-300 border border-slate-100 flex items-center justify-center text-2xl font-black shadow-sm shrink-0 uppercase">
                    {entry.user?.name?.[0]}
                    {entry.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight truncate">
                      {entry.user?.name} {entry.user?.lastName}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          @{entry.user?.username || "SIN_USUARIO"}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-l border-slate-100 pl-4">
                        ID Marcaje: #{entry.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Notas y Observaciones */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Reporte y Observaciones
                  </h4>
                </div>

                <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 shadow-sm">
                  {entry.notes ? (
                    <div className="space-y-4">
                      {entry.notes.split("\n").map((line, i) => {
                        const trimmed = line.trim();
                        if (
                          trimmed.startsWith("[ ]") ||
                          trimmed.startsWith("[x]")
                        ) {
                          const isChecked = trimmed.startsWith("[x]");
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-50 shadow-sm transition-all hover:border-slate-100"
                            >
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] ${isChecked ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-slate-50 text-slate-300 border border-slate-100"}`}
                              >
                                <FaCheckCircle />
                              </div>
                              <span
                                className={`text-[12px] font-black uppercase tracking-tight ${isChecked ? "text-slate-300 line-through" : "text-slate-600"}`}
                              >
                                {trimmed.replace(/\[.\]/, "").trim()}
                              </span>
                            </div>
                          );
                        }
                        if (trimmed.startsWith("---"))
                          return (
                            <div
                              key={i}
                              className="border-t border-slate-200/50 my-6"
                            />
                          );
                        if (!trimmed) return <div key={i} className="h-2" />;
                        return (
                          <p
                            key={i}
                            className="text-[13px] font-bold text-slate-600 leading-relaxed pl-4 border-l-4 border-indigo-100 italic"
                          >
                            "{trimmed}"
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        No se registraron notas adicionales
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Evidencia Multimedia */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Evidencia Multimedia
                  </h4>
                </div>

                {entry.media && entry.media.length > 0 ? (
                  <ITMediaGrid
                    media={entry.media}
                    title={`Evidencia de ${entry.user?.name}`}
                    gridSize={220}
                  />
                ) : (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                    <FaFileAlt size={32} className="mb-3 opacity-10" />
                    <p className="font-black text-[10px] uppercase tracking-widest">
                      Sin archivos adjuntos
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Columna Lateral - Info Temporal y Espacial */}
            <div className="lg:col-span-5 space-y-6">
              {/* Cronometría */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-3 bg-slate-200 rounded-full" />
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Cronometría del Marcaje
                  </h5>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-lg font-black shrink-0">
                      <FaCalendarAlt size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Fecha Registro
                      </p>
                      <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">
                        {dayjs(entry.timestamp).format("DD MMMM, YYYY")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg font-black shrink-0">
                      <FaSync size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Hora Exacta
                      </p>
                      <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight">
                        {dayjs(entry.timestamp).format("HH:mm:ss [HRS]")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Punto de Control / Mapa */}
              <div className="bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" />
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Punto de Control
                    </h5>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaMapMarkerAlt size={10} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">
                      {entry.location?.name || "N/A"}
                    </span>
                  </div>
                </div>
                {entry.latitude && (
                  <div className="rounded-[24px] overflow-hidden h-60 border border-slate-50">
                    <GoogleMapComponent
                      lat={Number(entry.latitude)}
                      lng={Number(entry.longitude)}
                      height="100%"
                      zoom={17}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="flex-none flex justify-end items-center px-8 py-6 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            variant="filled"
            color="secondary"
            className="px-8 font-black text-[10px] uppercase tracking-widest"
            onClick={onClose}
          >
            Cerrar Expediente
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

export default KardexDetailDialog;
