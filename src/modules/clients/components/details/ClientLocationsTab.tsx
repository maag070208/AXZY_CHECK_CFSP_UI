import { post } from "@app/core/axios/axios";
import { showToast } from "@app/core/store/toast/toast.slice";
import { BulkPrintModal } from "@app/modules/locations/components/BulkPrintModal";
import { LocationForm } from "@app/modules/locations/components/LocationForm";
import {
  Location,
  createLocation,
  deleteLocation,
  getPaginatedLocations,
  updateLocation,
} from "@app/modules/locations/service/locations.service";
import { ITButton, ITDataTable, ITDialog, ITLoader } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaMapMarkerAlt, FaPlus, FaQrcode, FaSync, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";

interface Props {
  clientId: string;
  selectedZoneId?: string | null;
  onCreateFromZone?: () => void;
}

export const ClientLocationsTab = ({ clientId, selectedZoneId, onCreateFromZone }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [createInitialData, setCreateInitialData] = useState<any>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (selectedZoneId) {
      setCreateInitialData({
        clientId: String(clientId),
        zoneId: selectedZoneId,
        name: "",
        reference: "",
      });
      setIsCreateModalOpen(true);
      onCreateFromZone?.();
    }
  }, [selectedZoneId]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedLocations({
        ...params,
        filters: { ...params.filters, clientId },
      });
    },
    [clientId],
  );

  const handlePrintBulk = async (ids: string[]) => {
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(showToast({ message: "PDF de QRs generado", type: "success" }));
      setIsBulkPrintOpen(false);
    } catch (error) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteLocation(locationToDelete.id);
      if (res.success) {
        dispatch(showToast({ message: "Ubicación eliminada", type: "success" }));
        setRefreshKey((prev) => prev + 1);
        setLocationToDelete(null);
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al eliminar",
            type: "error",
          }),
        );
      }
    } catch (err: any) {
      dispatch(
        showToast({
          message: err?.messages?.[0] || "Error al eliminar ubicación",
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
            size="small"
            variant="outlined"
            title="Imprimir QR"
          >
            <FaQrcode size={14} />
          </ITButton>
          <ITButton
            onClick={() => setEditingLocation(row)}
            size="small"
            variant="outlined"
            title="Editar"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => setLocationToDelete(row)}
            size="small"
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
            size="small"
            variant="ghost"
            className="w-9 h-9 p-0 flex items-center justify-center bg-slate-50 rounded-lg hover:bg-slate-100"
          >
            <FaSync className="text-slate-400" size={12} />
          </ITButton>
          <ITButton
            onClick={() => setIsBulkPrintOpen(true)}
            size="small"
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
            size="small"
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
        className="!max-w-md !w-full"
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
              onSubmit={async (data, keepOpen) => {
                try {
                  const res = await createLocation(data);
                  if (res.success) {
                    if (!keepOpen) {
                      setIsCreateModalOpen(false);
                      setCreateInitialData(null);
                    }
                    setRefreshKey((prev) => prev + 1);
                    dispatch(
                      showToast({
                        message: "Ubicación creada con éxito",
                        type: "success",
                      }),
                    );
                  } else {
                    dispatch(
                      showToast({
                        message: res.messages?.[0] || "Error al crear",
                        type: "error",
                      }),
                    );
                  }
                } catch (err: any) {
                  dispatch(
                    showToast({
                      message: err?.messages?.[0] || "Error al crear ubicación",
                      type: "error",
                    }),
                  );
                }
              }}
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
        className="!max-w-md !w-full"
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
              onSubmit={async (data) => {
                try {
                  const res = await updateLocation(editingLocation.id, data);
                  if (res.success) {
                    setEditingLocation(null);
                    setRefreshKey((prev) => prev + 1);
                    dispatch(
                      showToast({
                        message: "Ubicación actualizada",
                        type: "success",
                      }),
                    );
                  } else {
                    dispatch(
                      showToast({
                        message: res.messages?.[0] || "Error al actualizar",
                        type: "error",
                      }),
                    );
                  }
                } catch (err: any) {
                  dispatch(
                    showToast({
                      message: err?.messages?.[0] || "Error al actualizar ubicación",
                      type: "error",
                    }),
                  );
                }
              }}
              onCancel={() => setEditingLocation(null)}
            />
          )}
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title=""
        className="!max-w-md !w-full"
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
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="small"
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
