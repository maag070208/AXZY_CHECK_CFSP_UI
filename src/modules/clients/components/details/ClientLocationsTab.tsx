import { post } from "@app/core/axios/axios";
import { showToast } from "@app/core/store/toast/toast.slice";
import { LocationForm } from "@app/modules/locations/components/LocationForm";
import {
  createLocation,
  deleteLocation,
  getLocationsByClient,
  getPaginatedLocations,
  updateLocation,
} from "@app/modules/locations/service/locations.service";
import { ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import { FaEdit, FaPlus, FaQrcode, FaSync, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";

interface Props {
  clientId: string;
}

export const ClientLocationsTab = ({ clientId }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

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
    } catch (error) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    }
  };

  const handlePrintAll = async () => {
    setIsPrintingAll(true);
    try {
      const res = await getLocationsByClient(clientId);
      if (res.success && res.data) {
        const ids = res.data.map((l) => l.id);
        if (ids.length === 0) {
          dispatch(
            showToast({
              message: "No hay ubicaciones para imprimir",
              type: "warning",
            }),
          );
          return;
        }
        await handlePrintBulk(ids);
      }
    } finally {
      setIsPrintingAll(false);
    }
  };

  const handlePrintQR = async (location: Location) => {
    await handlePrintBulk([location.id]);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar esta ubicación?")) return;
    const res = await deleteLocation(id);
    if (res.success) {
      dispatch(showToast({ message: "Ubicación eliminada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Ubicación",
      type: "string",
      render: (row: Location) => (
        <div className="font-bold text-slate-700">{row.name}</div>
      ),
    },
    {
      key: "zone",
      label: "Zona / Recurrente",
      type: "string",
      render: (row: any) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
          {row.zone?.name || "Sin Zona"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: Location) => (
        <div className="flex gap-2">
          <ITButton
            onClick={() => handlePrintQR(row)}
            size="small"
            variant="ghost"
            className="text-emerald-600"
            title="QR"
          >
            <FaQrcode />
          </ITButton>
          <ITButton
            onClick={() => setEditingLocation(row)}
            size="small"
            variant="ghost"
            className="text-slate-400"
            title="Editar"
          >
            <FaEdit />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            size="small"
            variant="ghost"
            className="text-red-300"
            title="Eliminar"
          >
            <FaTrash />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Listado de Ubicaciones
        </h3>
        <div className="flex gap-2">
          <ITButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            size="small"
            variant="outlined"
            className="h-9 w-9 p-0 flex justify-center items-center"
          >
            <FaSync className="text-slate-400" />
          </ITButton>
          <ITButton
            onClick={handlePrintAll}
            disabled={isPrintingAll}
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-9 px-4 rounded-xl font-bold flex items-center gap-2 border"
          >
            <FaQrcode size={12} />
            {isPrintingAll ? "Generando..." : "Imprimir Todos (QR)"}
          </ITButton>
          <ITButton
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 text-white h-9 px-4 rounded-xl font-bold flex items-center gap-2"
          >
            <FaPlus size={12} />
            Nueva Ubicación
          </ITButton>
        </div>
      </div>

      <ITDataTable
        key={refreshKey}
        columns={columns as any}
        fetchData={memoizedFetch as any}
        defaultItemsPerPage={5}
      />

      <ITDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva Ubicación"
      >
        <LocationForm
          initialData={{
            clientId: String(clientId),
            aisle: "",
            spot: "",
            number: "",
            name: "",
          }}
          onSubmit={async (data, keepOpen) => {
            await createLocation(data);
            if (!keepOpen) {
              setIsCreateModalOpen(false);
            }
            setRefreshKey((prev) => prev + 1);
            dispatch(
              showToast({
                message: "Ubicación creada con éxito",
                type: "success",
              }),
            );
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Editar Ubicación"
      >
        {editingLocation && (
          <LocationForm
            initialData={editingLocation}
            onSubmit={async (data) => {
              await updateLocation(editingLocation.id, data);
              setEditingLocation(null);
              setRefreshKey((prev) => prev + 1);
              dispatch(showToast({ message: "Actualizado", type: "success" }));
            }}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </ITDialog>
    </div>
  );
};
