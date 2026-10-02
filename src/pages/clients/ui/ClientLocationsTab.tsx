import { BulkPrintModal } from "@features/print-location-qrs";
import type { Location } from "@entities/location";
import { useClientLocationsTab } from "../model/useClientLocationsTab";
import { LocationForm } from "@features/manage-location";
import { ITButton, ITDataTable, ITDialog, ITLoader } from "@axzydev/axzy_ui_system";
import { FaEdit, FaMapMarkerAlt, FaPlus, FaQrcode, FaSync, FaTrash } from "react-icons/fa";

interface Props {
  clientId: string;
  selectedZoneId?: string | null;
  onCreateFromZone?: () => void;
}

export const ClientLocationsTab = ({ clientId, selectedZoneId, onCreateFromZone }: Props) => {
  const {
    refreshKey,
    handleCreate,
    handleUpdate,
    setRefreshKey,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingLocation,
    setEditingLocation,
    locationToDelete,
    setLocationToDelete,
    isDeleting,
    isBulkPrintOpen,
    setIsBulkPrintOpen,
    createInitialData,
    setCreateInitialData,
    memoizedFetch,
    confirmDelete,
    handlePrintBulk,
  } = useClientLocationsTab({ clientId, selectedZoneId, onCreateFromZone });
  const columns = [
    {
      key: "name",
      label: "UBICACIÓN / IDENTIFICACIÓN",
      type: "string",
      render: (row: Location) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 text-sm">
            {row.name}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-slate-400 text-[10px]">
              {row.reference ? `REF: ${row.reference}` : "SIN REFERENCIA"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "zone",
      label: "ZONA / RECURRENTE",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 text-sm">
            {row.zone?.name || "SIN ZONA"}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[10px]">
              PUNTO DE CONTROL
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "CONTROL",
      type: "actions",
      actions: (row: Location) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => handlePrintBulk([row.id])}
            size="sm"
            variant="outlined"
            title="Imprimir QR"
          >
            <FaQrcode size={14} />
          </ITButton>
          <ITButton
            onClick={() => setEditingLocation(row)}
            size="sm"
            variant="outlined"
            title="Editar"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => setLocationToDelete(row)}
            size="sm"
            variant="outlined"
            color="error"
            title="Eliminar"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-medium text-slate-800">
            Directorio de Ubicaciones
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Gestión de puntos de control y códigos QR
          </p>
        </div>
        <div className="flex gap-2">
          <ITButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            size="sm"
            variant="ghost"
            className="w-9 h-9 p-0 flex items-center justify-center bg-slate-50 rounded-lg hover:bg-slate-100"
          >
            <FaSync className="text-slate-400" size={12} />
          </ITButton>
          <ITButton
            onClick={() => setIsBulkPrintOpen(true)}
            size="sm"
            variant="outlined"
            className="px-5 whitespace-nowrap shadow shadow-slate-100"
          >
            <div className="flex items-center gap-1">
              <FaQrcode size={14} />
              <span className="text-[10px]">Imprimir QRs</span>
            </div>
          </ITButton>
          <ITButton
            onClick={() => setIsCreateModalOpen(true)}
            color="primary"
            size="sm"
            className="px-5 whitespace-nowrap shadow shadow-sky-100"
          >
            <div className="flex items-center gap-1">
              <FaPlus size={14} />
              <span className="text-[10px]">Nueva Ubicación</span>
            </div>
          </ITButton>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={5}
        />
      </div>

      <ITDialog
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateInitialData(null);
        }}
        title=""
        className="!max-w-md w-full!"
      >
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaMapMarkerAlt size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Nueva Ubicación</h3>
                <p className="text-xs text-slate-400 font-light">Registrar punto de control</p>
              </div>
            </div>
          </div>
          {isCreateModalOpen && (
            <LocationForm
              initialData={
                createInitialData || {
                  clientId: String(clientId),
                  zoneId: "",
                  name: "",
                  reference: "",
                }
              }
              onSubmit={handleCreate}
              onCancel={() => {
                setIsCreateModalOpen(false);
                setCreateInitialData(null);
              }}
            />
          )}
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title=""
        className="!max-w-md w-full!"
      >
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaMapMarkerAlt size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Editar Ubicación</h3>
                <p className="text-xs text-slate-400 font-light">{editingLocation?.name || "Actualizar datos del punto de control"}</p>
              </div>
            </div>
          </div>
          {editingLocation && (
            <LocationForm
              initialData={editingLocation}
              onSubmit={handleUpdate}
              onCancel={() => setEditingLocation(null)}
            />
          )}
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title=""
        className="!max-w-md w-full!"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FaTrash size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Eliminar Ubicación</h3>
                <p className="text-xs text-slate-400 font-light">{locationToDelete?.name}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará la ubicación y todos sus registros asociados de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setLocationToDelete(null)}
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <BulkPrintModal
        isOpen={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
        onConfirm={handlePrintBulk}
        initialClientId={clientId}
      />
    </div>
  );
};
