import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
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
  FaPlus,
  FaRoute,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";

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
    const res = await deleteRoute(String(routeToDeleteId));
    setRouteToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
      refreshTable();
    } else {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const handleEdit = (route: any) => {
    navigate(`/routes/edit/${route.id}`);
  };

  const handleCreate = () => {
    navigate("/routes/new");
  };

  const clearFilters = () => {
    setSelectedClientId("");
    setSearchTerm("");
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-4 md:p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FaRoute className="text-[#065911]" />
          Gestión de Rutas
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestión de recorridos y puntos de control (Catálogo de Rondas)
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 mb-8 w-full">
        {(selectedClientId || searchTerm) && (
          <ITButton
            onClick={clearFilters}
            variant="outlined"
            color="secondary"
            className="h-[42px] px-4 !rounded-xl border-red-100 bg-red-50/30 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            size="small"
            title="Limpiar Filtros"
          >
            <FaTimes className="text-xs" />
            <span className="text-xs font-bold">Limpiar</span>
          </ITButton>
        )}

        <div className="w-full sm:w-64">
          <ITSearchSelect
            placeholder="Filtrar por Cliente"
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
        </div>

        <div className="w-full lg:w-64 relative">
          <ITInput
            placeholder="Buscar ruta..."
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={() => {}}
            className="!h-[42px] !rounded-xl border-slate-200 !pr-10 bg-white"
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
          onClick={refreshTable}
          variant="outlined"
          color="secondary"
          className="h-[42px] px-4 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
          size="small"
          title="Actualizar datos"
        >
          <FaSync
            className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? "" : "rotate-180"}`}
          />
          Refrescar
        </ITButton>

        <ITButton
          onClick={handleCreate}
          color="primary"
          className="h-[42px] !px-6 !py-2.5 !rounded-xl !bg-[#065911] hover:!bg-[#04400c] font-bold text-xs flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
        >
          <FaPlus className="text-xs" /> AGREGAR RUTA
        </ITButton>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
          columns={[
            {
              key: "client",
              label: "CLIENTE",
              type: "string",
              render: (row: any) => (
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-slate-400 text-xs" />
                  <span className="font-bold text-slate-700 uppercase text-[11px] tracking-tight">
                    {row.recurringLocations?.[0]?.location?.client?.name ||
                      "Sin Cliente"}
                  </span>
                </div>
              ),
            },
            {
              key: "title",
              label: "NOMBRE / REFERENCIA",
              type: "string",
              sortable: true,
              render: (row: any) => (
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-[#065911]">
                    <FaRoute className="text-xs" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 line-clamp-1 uppercase">
                      {row.title}
                    </p>
                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase">
                        RUTA DE SERVICIO
                      </span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: "locations",
              label: "UBICACIÓN / PUNTOS",
              type: "string",
              render: (row: any) => (
                <div className="flex flex-col py-2">
                  <span className="font-bold text-slate-700 text-xs leading-tight uppercase">
                    {row.recurringLocations?.[0]?.location?.name ||
                      "SIN UBICACIÓN"}
                  </span>
                  <span className="text-slate-400 text-[10px] font-medium">
                    {row.recurringLocations?.length || 0} Puntos registrados en
                    sistema
                  </span>
                </div>
              ),
            },
            {
              key: "active",
              label: "ESTADO",
              type: "string",
              render: (row: any) => (
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border ${row.active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                >
                  {row.active ? "ACTIVA" : "INACTIVA"}
                </span>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => handleEdit(row)}
                    variant="outlined"
                    color="secondary"
                    size="small"
                    className="!rounded-xl !p-2 !border-slate-200"
                    title="Editar"
                  >
                    <FaEdit size={14} className="text-slate-500" />
                  </ITButton>
                  <ITButton
                    onClick={() => handleDelete(row.id)}
                    color="danger"
                    variant="outlined"
                    size="small"
                    className="!rounded-xl !p-2 text-red-500 hover:!bg-red-50 border-red-200"
                    title="Eliminar"
                  >
                    <FaTrash size={14} />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Confirm Delete Dialog */}
      <ITDialog
        isOpen={!!routeToDeleteId}
        onClose={() => setRouteToDeleteId(null)}
        title="Eliminar Registro"
      >
        <div className="p-6">
          <p className="text-slate-600 mb-6 text-sm">
            ¿Estás seguro de eliminar esta ruta de servicio? Esta acción no se
            puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setRouteToDeleteId(null)}
              className="!rounded-lg"
            >
              Cancelar
            </ITButton>
            <ITButton
              className="!bg-red-600 text-white !rounded-lg"
              onClick={confirmDelete}
            >
              Eliminar permanentemente
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoutesPage;
