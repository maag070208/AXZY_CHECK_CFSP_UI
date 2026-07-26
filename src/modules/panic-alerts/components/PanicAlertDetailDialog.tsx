import { ITButton, ITDialog, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { FaBell, FaMapMarkerAlt, FaUserShield } from "react-icons/fa";
import { IPanicAlert } from "../services/PanicAlertsService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alert: IPanicAlert | null;
  onResolve: (alert: IPanicAlert) => void;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "PENDIENTE",
  IN_PROGRESS: "EN PROGRESO",
  RESOLVED: "ATENDIDA",
  DISMISSED: "DESCARTADA",
};

export const PanicAlertDetailDialog = ({
  isOpen,
  onClose,
  alert,
  onResolve,
}: Props) => {
  if (!alert) return null;

  const guardName = alert.guard
    ? `${alert.guard.name} ${alert.guard.lastName ?? ""}`.trim()
    : "—";

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Detalle de alerta">
      <div className="p-6 space-y-5 max-w-2xl">
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
            <FaBell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <ITText className="text-base font-black text-rose-900 uppercase tracking-tight">
              {alert.message ?? "Alerta de pánico"}
            </ITText>
            <ITText className="text-xs text-rose-700 font-bold uppercase tracking-widest mt-1">
              {dayjs(alert.createdAt).format("DD MMM YYYY · HH:mm")} HRS
            </ITText>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <FaUserShield className="text-emerald-600" size={14} />
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Guardia
              </ITText>
            </div>
            <ITText className="text-sm font-bold text-slate-900">
              {guardName}
            </ITText>
            <ITText className="text-xs text-slate-500">
              {alert.client?.name ?? "Sin cliente"}
            </ITText>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <FaMapMarkerAlt className="text-rose-600" size={14} />
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Ubicación
              </ITText>
            </div>
            {alert.triggerLatitude != null && alert.triggerLongitude != null ? (
              <>
                <ITText className="text-xs font-mono text-slate-700">
                  {alert.triggerLatitude.toFixed(6)},{" "}
                  {alert.triggerLongitude.toFixed(6)}
                </ITText>
                <a
                  href={`https://www.google.com/maps?q=${alert.triggerLatitude},${alert.triggerLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-bold text-rose-700 hover:text-rose-900 px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 transition-colors"
                >
                  Abrir en Google Maps
                </a>
              </>
            ) : (
              <ITText className="text-xs text-slate-400 italic">
                Sin coordenadas disponibles
              </ITText>
            )}
          </div>
        </div>

        {alert.message && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
              Mensaje
            </ITText>
            <ITText className="text-sm text-slate-700">{alert.message}</ITText>
          </div>
        )}

        {alert.resolutionComment && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <ITText className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5">
              Comentario de cierre
            </ITText>
            <ITText className="text-sm text-slate-700">
              {alert.resolutionComment}
            </ITText>
            {alert.resolvedBy && (
              <ITText className="text-[10px] text-emerald-700 mt-1.5 font-bold uppercase tracking-widest">
                Resuelto por: {alert.resolvedBy.name}{" "}
                {alert.resolvedBy.lastName ?? ""}
              </ITText>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div
            className={`w-2 h-2 rounded-full ${
              alert.status === "RESOLVED"
                ? "bg-emerald-500"
                : alert.status === "IN_PROGRESS"
                  ? "bg-amber-500"
                  : alert.status === "DISMISSED"
                    ? "bg-slate-400"
                    : "bg-rose-500"
            }`}
          />
          <ITText className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Estado: {STATUS_LABEL[alert.status] ?? alert.status}
          </ITText>
          {alert.resolvedAt && (
            <ITText className="text-xs text-slate-500 ml-auto">
              {dayjs(alert.resolvedAt).format("DD/MM/YYYY HH:mm")}
            </ITText>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <ITButton onClick={onClose} variant="outlined" color="secondary">
            Cerrar
          </ITButton>
          {alert.status === "PENDING" && (
            <ITButton
              onClick={() => {
                onResolve(alert);
                onClose();
              }}
              color="success"
            >
              Marcar como atendida
            </ITButton>
          )}
        </div>
      </div>
    </ITDialog>
  );
};
