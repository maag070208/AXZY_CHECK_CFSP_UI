import { ITButton, ITDialog, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaEdit, FaLayerGroup, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { ConfirmDialog, FieldLabel, SURFACE, TONES } from "@shared/ui";
import { useManageZones, useManageZonesDeps } from "../model/useManageZones";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

/** Administración de zonas de un cliente. Sólo pinta. */
export const ZonesModal = ({ isOpen, onClose, clientId, clientName }: Props) => {
  const vm = useManageZones(useManageZonesDeps(), { isOpen, clientId });

  return (
    <>
      <ITDialog isOpen={isOpen} onClose={onClose} title="Administrar zonas" className="!max-w-lg w-full!">
        <div className="space-y-7">
          <ITText className="block text-[11px] font-medium text-secondary-400">{clientName}</ITText>

          <section className="space-y-3">
            <FieldLabel>Nueva zona / recurrente</FieldLabel>
            <div className="flex gap-3 rounded-2xl border border-dashed border-secondary-200 bg-secondary-50/60 p-4 dark:border-secondary-700 dark:bg-secondary-800/40">
              <ITInput
                name="newZone"
                placeholder="Ej. Sótano 1, Ala Norte..."
                value={vm.newName}
                onChange={(e) => vm.setNewName(e.target.value)}
                onBlur={() => {}}
                className="flex-1"
              />
              <ITButton
                onClick={vm.create}
                color="primary"
                size="sm"
                disabled={!vm.newName.trim() || vm.saving}
                className="whitespace-nowrap px-5"
              >
                <span className="flex items-center gap-1.5">
                  <FaPlus size={12} />
                  <ITText as="span" className="text-[10px] font-black uppercase tracking-wider">
                    Agregar
                  </ITText>
                </span>
              </ITButton>
            </div>
          </section>

          <section className="space-y-3">
            <FieldLabel>Zonas registradas ({vm.zones.length})</FieldLabel>

            {vm.zones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-secondary-200 py-8 text-center dark:border-secondary-700">
                <ITText className="text-xs text-secondary-400">
                  {vm.loading ? "Cargando zonas…" : "Este cliente todavía no tiene zonas."}
                </ITText>
              </div>
            ) : (
              <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                {vm.zones.map((zone) => {
                  const isEditing = vm.editing?.id === zone.id;
                  return (
                    <div
                      key={zone.id}
                      className={`group flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                        isEditing
                          ? "border-primary-300 bg-primary-50/40 dark:border-primary-700 dark:bg-primary-950/30"
                          : "border-secondary-100 bg-white hover:border-secondary-200 dark:border-secondary-800 dark:bg-secondary-900"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isEditing
                              ? `${TONES.brand.soft} ${TONES.brand.softText}`
                              : `${TONES.neutral.soft} ${TONES.neutral.softText}`
                          }`}
                        >
                          <FaLayerGroup size={14} />
                        </span>

                        {isEditing ? (
                          <input
                            type="text"
                            value={vm.editing?.name ?? ""}
                            onChange={(e) => vm.setEditing({ ...zone, name: e.target.value })}
                            className={`flex-1 border-b-2 border-primary-500 bg-transparent py-1 text-sm font-medium uppercase tracking-tight outline-none ${SURFACE.strong}`}
                            autoFocus
                          />
                        ) : (
                          <div className="flex min-w-0 flex-col">
                            <ITText className={`truncate text-sm font-medium uppercase tracking-tight ${SURFACE.strong}`}>
                              {zone.name}
                            </ITText>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className={`h-1 w-1 rounded-full ${zone.active ? TONES.success.dot : TONES.neutral.dot}`} />
                              <ITText className="text-[9px] font-medium uppercase tracking-widest text-secondary-400">
                                {zone.active ? "Activo" : "Inactivo"}
                              </ITText>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-3 flex shrink-0 items-center gap-1.5">
                        {isEditing ? (
                          <>
                            <ITButton size="sm" variant="text" color="primary" onClick={vm.saveEdit} disabled={vm.saving}>
                              <ITText as="span" className="px-2 text-[9px] font-black uppercase tracking-widest">
                                Guardar
                              </ITText>
                            </ITButton>
                            <button
                              type="button"
                              aria-label="Cancelar edición"
                              className="p-2 text-secondary-400 transition-colors hover:text-secondary-600"
                              onClick={() => vm.setEditing(null)}
                            >
                              <FaTimes size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <ITButton
                              size="sm"
                              variant="outlined"
                              color="secondary"
                              title="Editar"
                              onClick={() => vm.setEditing(zone)}
                            >
                              <FaEdit size={12} />
                            </ITButton>
                            <ITButton
                              size="sm"
                              variant="outlined"
                              color="danger"
                              title="Eliminar"
                              onClick={() => vm.requestDelete(zone)}
                            >
                              <FaTrash size={12} />
                            </ITButton>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </ITDialog>

      {/* Antes esto era un `window.confirm`, prohibido por FANSAL_RULES §3F. */}
      <ConfirmDialog
        isOpen={!!vm.zoneToDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar zona"
        message={
          vm.zoneToDelete
            ? `Se eliminará la zona "${vm.zoneToDelete.name}". Esta acción es permanente.`
            : ""
        }
        confirmLabel="Eliminar"
      />
    </>
  );
};
