import { post } from "@app/core/axios/axios";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaFilter,
  FaMapMarkedAlt,
  FaPrint,
  FaQrcode,
  FaSearchLocation,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { ZonesModal } from "../../zones/components/ZonesModal";
import { BulkPrintModal } from "../components/BulkPrintModal";
import { LocationForm } from "../components/LocationForm";
import {
  createLocation,
  deleteLocation,
  getPaginatedLocations,
  Location,
  updateLocation,
} from "../service/locations.service";

const LocationsPage = () => {
  const [searchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(
    searchParams.get("clientId") || "",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZonesModalOpen, setIsZonesModalOpen] = useState(false);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  useEffect(() => {
    const cid = searchParams.get("clientId");
    if (cid) {
      setSelectedClientId(cid);
    }
  }, [searchParams]);

  const { data: clients } = useCatalog("client");

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedClientId]);

  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null,
  );

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedLocations(params);
  }, []);

  const externalFilters = useMemo(() => {
    return { name: searchTerm, clientId: selectedClientId };
  }, [searchTerm, selectedClientId]);

  const handleCreate = async (data: any, keepOpen?: boolean) => {
    dispatch(showLoader());
    try {
      const res = await createLocation(data);
      if (res.success) {
        dispatch(
          showToast({ message: "Ubicación creada con éxito", type: "success" }),
        );
        if (!keepOpen) {
          setIsModalOpen(false);
        }
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({
            message: res?.messages?.join(", ") || "Error al crear",
            type: "error",
          }),
        );
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingLocation) return;
    dispatch(showLoader());
    try {
      const res = await updateLocation(editingLocation.id, data);
      if (res.success) {
        dispatch(
          showToast({ message: "Ubicación actualizada", type: "success" }),
        );
        setEditingLocation(null);
        setRefreshKey((prev) => prev + 1);
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    dispatch(showLoader());
    try {
      const res = await deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      if (res && res.success) {
        dispatch(
          showToast({ message: "Ubicación eliminada", type: "success" }),
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({
            message: res?.messages?.join(", ") || "Error al eliminar",
            type: "error",
          }),
        );
      }
    } catch (e: any) {
      dispatch(
        showToast({ message: e.message || "Error al eliminar", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePrintQR = async (location: Location) => {
    dispatch(showLoader());
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids: [location.id] },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(
        showToast({ message: "PDF generado con éxito", type: "success" }),
      );
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePrintBulk = async (ids: string[]) => {
    dispatch(showLoader());
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(
        showToast({ message: "PDF generado con éxito", type: "success" }),
      );
      setIsBulkPrintModalOpen(false);
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "UBICACIÓN / IDENTIFICACIÓN",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.name}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                CLIENTE: {row.client?.name || row.clientName || "SIN ASIGNAR"}
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
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.zone?.name || "SIN ZONA"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                PUNTO DE CONTROL
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        label: "ACCIONES",
        type: "actions",
        actions: (row: Location) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => handlePrintQR(row)}
              size="small"
              variant="outlined"
              title="Individual QR"
            >
              <FaQrcode size={14} />
            </ITButton>
            {user?.role !== "OPERATOR" && (
              <>
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
              </>
            )}
          </div>
        ),
      },
    ],
    [user],
  );

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Directorio de Ubicaciones"
        subtitle="Gestión y control de puntos QR para rondines y asistencia"
        icon={FaSearchLocation}
        filter={
          <ITSearchSelect
            className="!z-20"
            placeholder="Filtrar por Cliente..."
            options={(clients || []).map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
            value={selectedClientId}
            onChange={(val: any) => setSelectedClientId(val)}
          />
        }
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR UBICACIÓN...",
          icon: FaSearchLocation,
        }}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
        onCreate={
          user?.role !== "OPERATOR" ? () => setIsModalOpen(true) : undefined
        }
        createLabel="Nueva Ubicación"
        actions={
          <div className="flex items-center gap-3">
            {selectedClientId && (
              <ITButton
                onClick={() => setIsZonesModalOpen(true)}
                variant="filled"
                color="secondary"
              >
                <div className="flex items-center gap-2">
                  <FaMapMarkedAlt size={12} />
                  <span className="hidden lg:inline">Zonas del Cliente</span>
                </div>
              </ITButton>
            )}

            <ITButton
              onClick={() => setIsBulkPrintModalOpen(true)}
              variant="filled"
            >
              <div className="flex items-center gap-2">
                <FaPrint size={12} />
                <span className="hidden lg:inline">Imprimir</span>
              </div>
            </ITButton>

            {(searchTerm || selectedClientId) && (
              <ITButton
                onClick={() => {
                  setSearchTerm("");
                  setSelectedClientId("");
                }}
                variant="filled"
                color="error"
                size="small"
                title="Limpiar Filtros"
              >
                <FaFilter size={12} />
              </ITButton>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
        />
      </div>

      <BulkPrintModal
        isOpen={isBulkPrintModalOpen}
        onClose={() => setIsBulkPrintModalOpen(false)}
        onConfirm={handlePrintBulk}
        initialClientId={selectedClientId as string}
      />

      <ZonesModal
        isOpen={isZonesModalOpen}
        onClose={() => setIsZonesModalOpen(false)}
        clientId={selectedClientId as string}
        clientName={
          clients?.find((c: any) => String(c.id) === String(selectedClientId))
            ?.name || "Cliente"
        }
      />

      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registro de Ubicación"
      >
        <LocationForm
          initialData={
            selectedClientId
              ? {
                  clientId: selectedClientId as string,
                  aisle: "",
                  spot: "",
                  number: "",
                  name: "",
                }
              : undefined
          }
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Actualizar Ubicación"
      >
        {editingLocation && (
          <LocationForm
            initialData={editingLocation}
            onSubmit={handleEdit}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <FaTrash size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            ¿Eliminar ubicación?
          </h3>
          <p className="text-slate-500 text-sm mb-8">
            Estás por borrar{" "}
            <span className="font-bold text-slate-700">
              {locationToDelete?.name}
            </span>
            .<br />
            Esta acción es permanente y no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-center">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setLocationToDelete(null)}
              className="!rounded-xl px-8"
            >
              No, Mantener
            </ITButton>
            <ITButton
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white !rounded-xl px-8 border-none"
            >
              Sí, Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default LocationsPage;
