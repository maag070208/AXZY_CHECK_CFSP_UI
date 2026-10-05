import { ITBadget, ITButton, ITDialog, ITText } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import dayjs from "dayjs";
import { FaCheck, FaCheckCircle, FaFileAlt, FaMapMarkerAlt, FaPaperclip, FaTrash, FaUserShield } from "react-icons/fa";
import { Maintenance } from "@entities/maintenance";
import { DetailMeta, DetailRow, DetailSection, SURFACE, TONES } from "@shared/ui";

interface MaintenanceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance | null;
  onResolve: (id: string) => void;
  onDelete: (maintenance: Maintenance) => void;
  isAdmin: boolean;
  isClient: boolean;
}

/**
 * Detalle de un mantenimiento. Usa los tokens semánticos de la WEB (nada de
 * colores crudos) para que funcione igual en claro y en oscuro.
 */
const MaintenanceDetailDialog = ({
  isOpen,
  onClose,
  maintenance,
  onResolve,
  onDelete,
  isAdmin,
  isClient,
}: MaintenanceDetailDialogProps) => {
  if (!maintenance) return null;

  const attended = maintenance.status === "ATTENDED";
  const hasLocation = maintenance.latitude != null && maintenance.longitude != null;
  const hasMedia = (maintenance.media?.length ?? 0) > 0;
  const category = maintenance.categoryRel?.name || maintenance.category || "General";

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Mantenimiento"
      className="max-w-[95vw]! md:!max-w-[80vw] lg:!max-w-5xl w-full!"
    >
      <div className="flex max-h-[85vh] w-full flex-col overflow-hidden bg-white dark:bg-secondary-900">
        <div className="custom-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-7">
          {/* ── Encabezado ─────────────────────────────────────────── */}
          <header className="rounded-2xl border border-secondary-100 bg-secondary-50/70 p-5 dark:border-secondary-800 dark:bg-secondary-800/40 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${attended ? TONES.success.dot : TONES.info.dot}`} />
                  <span className={SURFACE.microLabel}>{category}</span>
                </div>
                <ITText as="h3" className={`mt-1.5 text-2xl font-black tracking-tight wrap-break-word ${SURFACE.strong}`}>
                  {maintenance.title}
                </ITText>
              </div>
              <ITBadget color={attended ? "success" : "danger"} label={attended ? "ATENDIDA" : "PENDIENTE"} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DetailMeta label="Categoría" value={category} tone="info" />
              <DetailMeta label="Sitio" value={maintenance.client?.name || "—"} tone="brand" />
              <DetailMeta label="Fecha" value={dayjs(maintenance.createdAt).format("DD MMM YYYY")} />
              <DetailMeta label="Hora" value={`${dayjs(maintenance.createdAt).format("HH:mm")} hrs`} />
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* ── Columna principal ────────────────────────────────── */}
            <div className="space-y-5 lg:col-span-7">
              <DetailSection title="Descripción" icon={<FaFileAlt size={12} />}>
                <ITText as="p" className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-secondary-600 dark:text-secondary-300">
                  {maintenance.description || "Sin descripción detallada disponible."}
                </ITText>
              </DetailSection>

              <DetailSection title="Evidencia" icon={<FaPaperclip size={12} />}>
                {hasMedia ? (
                  <ITMediaGrid media={maintenance.media ?? []} title={maintenance.title} gridSize={220} />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-200 py-10 text-center dark:border-secondary-700">
                    <FaFileAlt size={24} className="mb-2 text-secondary-300 dark:text-secondary-600" />
                    <ITText as="p" className={SURFACE.microLabel}>
                      Sin archivos adjuntos
                    </ITText>
                  </div>
                )}
              </DetailSection>
            </div>

            {/* ── Columna lateral ──────────────────────────────────── */}
            <div className="space-y-5 lg:col-span-5">
              <DetailSection title="Reportante" icon={<FaUserShield size={12} />}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black ${TONES.info.soft} ${TONES.info.softText}`}>
                    {maintenance.guard?.name?.[0]}
                    {maintenance.guard?.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <ITText as="p" className={`truncate text-[13px] font-bold tracking-tight ${SURFACE.strong}`}>
                      {maintenance.guard?.name} {maintenance.guard?.lastName}
                    </ITText>
                    <ITText as="p" className="mt-0.5 truncate text-[11px] font-bold text-secondary-400 dark:text-secondary-500">
                      @{maintenance.guard?.username ?? "sin usuario"}
                    </ITText>
                  </div>
                </div>
                <div className="mt-4 border-t border-secondary-100 pt-3 dark:border-secondary-800">
                  <DetailRow label="ID reporte" value={`#${maintenance.id.slice(0, 8)}`} />
                </div>
              </DetailSection>

              {hasLocation && (
                <DetailSection
                  title="Ubicación del reporte"
                  icon={<FaMapMarkerAlt size={12} />}
                  bodyClassName="!px-2 !pb-2"
                >
                  <div className="h-44 overflow-hidden rounded-xl border border-secondary-100 dark:border-secondary-800">
                    <GoogleMapComponent lat={maintenance.latitude!} lng={maintenance.longitude!} height="100%" />
                  </div>
                </DetailSection>
              )}

              {attended && maintenance.resolvedBy && (
                <div className={`${TONES.success.soft} rounded-2xl border ${TONES.success.border} p-5`}>
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONES.success.solid}`}>
                      <FaCheckCircle size={14} />
                    </span>
                    <ITText as="h4" className={`${SURFACE.sectionLabel} ${TONES.success.text}`}>
                      Atención finalizada
                    </ITText>
                  </div>
                  <div className="space-y-3">
                    <DetailRow label="Gestionado por" value={`${maintenance.resolvedBy.name} ${maintenance.resolvedBy.lastName ?? ""}`} />
                    <DetailRow label="Fecha y hora" value={dayjs(maintenance.resolvedAt).format("DD MMM YYYY · HH:mm")} />
                  </div>
                </div>
              )}

              {maintenance.status === "PENDING" && !isClient && (
                <div className={`${TONES.warning.soft} rounded-2xl border ${TONES.warning.border} p-5`}>
                  <ITText as="h4" className={`${SURFACE.sectionLabel} ${TONES.warning.text}`}>
                    Respuesta requerida
                  </ITText>
                  <ITText as="p" className="mt-1.5 text-[12px] font-medium leading-relaxed text-secondary-600 dark:text-secondary-300">
                    Este reporte requiere validación técnica inmediata.
                  </ITText>
                  <ITButton
                    onClick={() => onResolve(maintenance.id)}
                    variant="filled"
                    color="success"
                    className="mt-4 w-full"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <FaCheck size={13} />
                      Finalizar atención
                    </span>
                  </ITButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="flex flex-none items-center justify-end gap-3 border-t border-secondary-100 bg-secondary-50/60 px-5 py-4 dark:border-secondary-800 dark:bg-secondary-900/60 sm:px-7">
          {isAdmin && (
            <ITButton variant="outlined" color="danger" onClick={() => onDelete(maintenance)}>
              <span className="flex items-center gap-2">
                <FaTrash size={12} />
                Eliminar
              </span>
            </ITButton>
          )}
          <ITButton variant="filled" color="secondary" onClick={onClose}>
            Cerrar
          </ITButton>
        </footer>
      </div>
    </ITDialog>
  );
};

export default MaintenanceDetailDialog;
