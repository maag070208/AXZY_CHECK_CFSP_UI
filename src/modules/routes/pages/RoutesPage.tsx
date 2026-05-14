import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaEdit,
  FaFilter,
  FaPlus,
  FaRoute,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>("");

  const { data: clients } = useCatalog("client");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return {
      title: searchTerm,
      clientId: selectedClientId,
    };
  }, [searchTerm, selectedClientId]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRoutes(params);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleDelete = (id: number) => {
    setRouteToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!routeToDeleteId) return;
    dispatch(showLoader());
    try {
      const res = await deleteRoute(String(routeToDeleteId));
      setRouteToDeleteId(null);
      if (res.success) {
        dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
        refreshTable();
      } else {
        dispatch(showToast({ message: "Error al eliminar", type: "error" }));
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleEdit = (route: any) => {
    navigate(`/routes/edit/${route.id}`);
  };

  const handleCreate = () => {
    navigate("/routes/new");
  };

  const columns = [
    {
      key: "client",
      label: "Cliente / Entidad",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <FaBuilding className="text-slate-400 text-[10px]" />
            <span className="font-black text-slate-700 uppercase text-[10px] tracking-widest">
              {row.recurringLocations?.[0]?.location?.client?.name ||
                "Sin Cliente"}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            ID:{" "}
            {row.recurringLocations?.[0]?.location?.client?.id?.slice(-8) ||
              "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "title",
      label: "Ruta / Referencia",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
            {row.title}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
              {row.client?.name || "SIN CLIENTE"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "locations",
      label: "PUNTOS DE CONTROL",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
            {row.recurringLocations?.length || 0} Puntos QR
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
              Ubicación:{" "}
              {row.recurringLocations?.[0]?.location?.name || "Multiple"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "active",
      label: "ESTADO",
      type: "string",
      render: (row: any) => (
        <ITBadget color={row.active ? "success" : "error"} size="small">
          {row.active ? "ACTIVO" : "INACTIVO"}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "CONTROL",
      type: "actions",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => handleEdit(row)}
            variant="outlined"
            title="Editar Ruta"
            size="small"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            variant="outlined"
            color="error"
            title="Eliminar Ruta"
            size="small"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Gestión de Rutas"
        subtitle="Configuración de recorridos y puntos de control para rondines"
        icon={FaRoute}
        filter={
          <ITSearchSelect
            className="!z-20"
            placeholder="Filtrar por Cliente..."
            options={(clients || []).map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
            value={selectedClientId}
            onChange={(val) => {
              setSelectedClientId(val);
              setRefreshKey((prev) => prev + 1);
            }}
          />
        }
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR RUTA...",
          icon: FaRoute,
        }}
        showClearFilters={!!(searchTerm || selectedClientId)}
        onClearFilters={() => {
          setSearchTerm("");
          setSelectedClientId("");
          setRefreshKey((prev) => prev + 1);
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={handleCreate}
        createLabel="Nueva Ruta"
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

      <ITDialog
        isOpen={!!routeToDeleteId}
        onClose={() => setRouteToDeleteId(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <FaTrash size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2 uppercase tracking-tight">
            ¿Eliminar Ruta Operativa?
          </h3>
          <p className="text-slate-500 text-sm mb-10 leading-relaxed px-4">
            Estás por borrar una ruta y sus puntos de control.
            <br />
            <span className="font-bold text-red-500/80">
              Esta acción es permanente y no se puede deshacer.
            </span>
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setRouteToDeleteId(null)}
              className="!rounded-xl px-10"
            >
              <span className="uppercase tracking-widest text-[10px] font-black">
                No, Mantener
              </span>
            </ITButton>
            <ITButton
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white !rounded-xl px-10 border-none shadow-lg shadow-red-100"
            >
              <span className="uppercase tracking-widest text-[10px] font-black">
                Sí, Eliminar
              </span>
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoutesPage;
