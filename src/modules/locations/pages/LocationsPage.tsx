import { post } from "@app/core/axios/axios";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDataTable, ITDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaFilter, FaMapMarkedAlt, FaPlus, FaPrint, FaQrcode, FaSearchLocation, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { ZonesModal } from "../../zones/components/ZonesModal";
import { BulkPrintModal } from "../components/BulkPrintModal";
import { LocationForm } from "../components/LocationForm";
import { createLocation, deleteLocation, getPaginatedLocations, Location, updateLocation } from "../service/locations.service";

const LocationsPage = () => {
  const [searchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(searchParams.get("clientId") || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZonesModalOpen, setIsZonesModalOpen] = useState(false);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  // Sync selectedClientId with URL search params
  useEffect(() => {
    const cid = searchParams.get("clientId");
    if (cid) {
      setSelectedClientId(cid);
    }
  }, [searchParams]);

  const { data: clients } = useCatalog("client");

  // Debounce search to trigger refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedClientId]);
  
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  /* Filters/Modals State */
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedLocations(params);
  }, []);

  const externalFilters = useMemo(() => {
    return { name: searchTerm, clientId: selectedClientId };
  }, [searchTerm, selectedClientId]);

  const handleCreate = async (data: any) => {
    await createLocation(data);
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = async (data: any) => {
      if (!editingLocation) return;
      await updateLocation(editingLocation.id, data);
      setEditingLocation(null);
      setRefreshKey(prev => prev + 1);
  };

  const handleDelete = (location: Location) => {
      setLocationToDelete(location);
  };

  const confirmDelete = async () => {
      if (!locationToDelete) return;
      try {
          const res = await deleteLocation(locationToDelete.id);
          setLocationToDelete(null);
          if (res && res.success) {
               dispatch(showToast({ message: "Ubicación eliminada correctamente", type: "success" }));
               setRefreshKey(prev => prev + 1);
          } else {
               dispatch(showToast({ message: res?.messages?.join(", ") || "Error al eliminar", type: "error" }));
          }
      } catch (e: any) {
          dispatch(showToast({ message: e.message || "Error al eliminar", type: "error" }));
      }
  };

  const handlePrintQR = async (location: Location) => {
      try {
          const res = await post<any>("/locations/print-qrs", { ids: [location.id] }, { responseType: 'blob' });
          const blob = new Blob([res as any], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          dispatch(showToast({ message: "Vista previa del QR generada", type: "success" }));
      } catch (error) {
          console.error("Error generating individual PDF", error);
          dispatch(showToast({ message: "Error al generar el código QR", type: "error" }));
      }
  };

  const columns = useMemo(() => [
      { 
          key: "name", 
          label: "Ubicación", 
          type: "string", 
          sortable: true,
          render: (row: any) => (
              <div>
                  <div className="font-bold text-slate-800">{row.name}</div>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <FaBuilding className="text-slate-400" />
                      {row.client?.name || row.clientName || 'Sin Cliente'}
                  </div>
              </div>
          )
      },
      { 
          key: "zone", 
          label: "Recurrente", 
          type: "string", 
          render: (row: any) => (
              <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase border border-emerald-100">
                      {row.zone?.name || 'S/Z'}
                  </span>
              </div>
          )
      },
      {
          key: "actions",
          label: "Acciones",
          type: "actions",
          actions: (row: Location) => (
              <div className="flex items-center gap-2">
                  <ITButton
                      onClick={() => handlePrintQR(row)}
                      size="small"
                      variant="outlined"
                      color="primary"
                      className="!p-2"
                      title="Imprimir QR Individual"
                  >
                      <FaQrcode />
                  </ITButton>
                   {user?.role !== "OPERATOR" && (
                       <>
                          <ITButton
                              onClick={() => setEditingLocation(row)}
                              size="small"
                              variant="ghost"
                              className="!p-2 text-slate-400 hover:text-slate-600"
                              title="Editar"
                          >
                              <FaEdit />
                          </ITButton>
                          <ITButton
                              onClick={() => handleDelete(row)}
                              size="small"
                              variant="ghost"
                              className="!p-2 text-red-300 hover:text-red-500"
                              title="Eliminar"
                          >
                              <FaTrash />
                          </ITButton>
                       </>
                   )}
              </div>
          )
      }
  ], [user]);

  return (
    <div className="p-4 md:p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FaSearchLocation className="text-emerald-600" />
          Ubicaciones
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gestión de zonas y puntos de control de clientes</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 mb-8 w-full">
        <ITButton
          onClick={() => setIsBulkPrintModalOpen(true)}
          color="primary"
          variant="outlined"
          className="h-[42px] px-5 !rounded-xl border-emerald-600 text-emerald-600 hover:bg-emerald-50 shadow-sm flex items-center justify-center gap-2 transition-all font-bold w-full sm:w-auto"
        >
          <FaPrint className="text-xs" />
          <span>Impresión Masiva</span>
        </ITButton>

        <div className="w-full sm:w-64">
          <ITSearchSelect
            placeholder="Filtrar por Cliente"
            options={(clients || []).map((c: any) => ({ label: c.name || c.label, value: c.id }))}
            value={selectedClientId}
            onChange={(val: any) => setSelectedClientId(val)}
          />
        </div>
        <div className="w-full sm:w-64 relative">
          <ITInput
            placeholder="Buscar por nombre..."
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => { }}
            className="!py-2 !h-[42px] !rounded-xl border-slate-100 !pr-10 bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              title="Limpiar búsqueda"
            >
              <FaTimes size={14} />
            </button>
          )}
        </div>
        <ITButton
          onClick={() => setRefreshKey(prev => prev + 1)}
          color="secondary"
          variant="outlined"
          className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
          size="small"
          title="Actualizar tabla"
        >
          <FaSync className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? '' : 'rotate-180'}`} />
        </ITButton>
        {(searchTerm || selectedClientId) && (
          <ITButton
            onClick={() => {
              setSearchTerm("");
              setSelectedClientId("");
            }}
            color="secondary"
            variant="outlined"
            className="h-[42px] px-3 !rounded-xl border-red-100 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            size="small"
            title="Limpiar filtros"
          >
            <FaFilter className="text-xs" />
            <span className="text-xs font-bold">Limpiar</span>
          </ITButton>
        )}
        {selectedClientId && (
          <ITButton
            onClick={() => setIsZonesModalOpen(true)}
            variant="outlined"
            className="h-[42px] px-3 !rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            size="small"
          >
            <FaMapMarkedAlt className="text-xs" />
            <span className="text-xs font-bold sm:hidden">Ver Zonas</span>
          </ITButton>
        )}
        {user?.role !== "OPERATOR" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all w-full sm:w-auto"
          >
            <FaPlus className="text-xs" />
            <span>Nueva Ubicación</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
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
      />

      <ZonesModal 
        isOpen={isZonesModalOpen} 
        onClose={() => setIsZonesModalOpen(false)} 
        clientId={selectedClientId as string} 
        clientName={clients?.find((c: any) => String(c.id) === String(selectedClientId))?.name || "Cliente"}
      />

      {/* Create Modal */}
      <ITDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Ubicación">
        <LocationForm 
          initialData={selectedClientId ? { clientId: selectedClientId as string, aisle: '', spot: '', number: '', name: '' } : undefined}
          onSubmit={handleCreate} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </ITDialog>

      {/* Edit Modal */}
      <ITDialog isOpen={!!editingLocation} onClose={() => setEditingLocation(null)} title="Editar Ubicación">
        {editingLocation && (
            <LocationForm 
                initialData={editingLocation}
                onSubmit={handleEdit} 
                onCancel={() => setEditingLocation(null)} 
            />
        )}
      </ITDialog>

      {/* Delete Confirmation Modal */}
      <ITDialog isOpen={!!locationToDelete} onClose={() => setLocationToDelete(null)} title="Confirmar Eliminación">
        <div className="p-6">
            <p className="text-[#1b1b1f] text-base mb-6">
                ¿Estás seguro de que deseas eliminar la ubicación <span className="font-bold text-red-600">{locationToDelete?.name}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
                <ITButton variant="outlined" color="secondary" onClick={() => setLocationToDelete(null)}>
                    Cancelar
                </ITButton>
                <ITButton variant="solid" className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={confirmDelete}>
                    Eliminar
                </ITButton>
            </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default LocationsPage;
