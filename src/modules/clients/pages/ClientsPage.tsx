import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { clearSpecificCatalogCache } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { TResult } from "@app/core/types/TResult";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDataTableFetchParams,
  ITDialog,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaEdit,
  FaPlus,
  FaSearchLocation,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CreateClientWizard } from "../components/CreateClientWizard";
import {
  Client,
  deleteClient,
  getPaginatedClients,
} from "../services/ClientsService";

const ClientsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Immediate refresh for status filter
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [statusFilter]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean | Date> = {};
    if (searchTerm) filters.name = searchTerm;
    if (statusFilter !== "all")
      filters.active = statusFilter === "active" ? true : false;
    return filters;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    async (params: ITDataTableFetchParams): Promise<any> => {
      const res = await getPaginatedClients(params);
      return res.success && res.data
        ? { data: res.data.rows, total: res.data.total }
        : { data: [], total: 0 };
    },
    [],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingClient(null);
    refreshTable();
  };

  const confirmDelete = async () => {
    if (!clientToDeleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteClient(clientToDeleteId);
      dispatch(showToast({ message: "Cliente eliminado", type: "success" }));
      clearSpecificCatalogCache("client");
      refreshTable();
      setClientToDeleteId(null);
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result?.messages?.[0] || "Error al eliminar cliente",
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Directorio de Clientes"
        subtitle="Gestión de clientes y sus ubicaciones"
        icon={FaBuilding}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR CLIENTE...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={() => setIsCreateModalOpen(true)}
        createLabel="Nuevo Cliente"
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { label: "TODOS", value: "all" },
              { label: "ACTIVOS", value: "active" },
              { label: "INACTIVOS", value: "inactive" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<Client & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
          columns={[
            {
              key: "name",
              label: "CLIENTE / ENTIDAD",
              type: "string",
              sortable: true,
              render: (row: Client) => (
                <div className="flex flex-col">
                  <span
                    onClick={() => navigate(`/clients/${row.id}`)}
                    className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 hover:text-emerald-600 cursor-pointer transition-colors"
                  >
                    {row.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      ID: {row.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: "contact",
              label: "CONTACTO",
              type: "string",
              render: (row: Client) => (
                <div className="flex flex-col">
                  <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    {row.contactName || "SIN CONTACTO"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      TEL: {row.contactPhone || "N/A"}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: Client) => (
                <ITBadget color={row.active ? "success" : "error"} size="small">
                  {row.active ? "ACTIVO" : "INACTIVO"}
                </ITBadget>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: Client) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => navigate(`/clients/${row.id}`)}
                    size="small"
                    variant="outlined"
                    title="Ver Detalles"
                  >
                    <FaSearchLocation size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => setEditingClient(row)}
                    size="small"
                    variant="outlined"
                    title="Editar"
                  >
                    <FaEdit size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => setClientToDeleteId(row.id)}
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
          ]}
        />
      </div>

      {/* Modals matching the high-end style */}
      <ITDialog
        isOpen={isCreateModalOpen || !!editingClient}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingClient(null);
        }}
        title={
          editingClient
            ? `Editar Cliente: ${editingClient.name}`
            : "Nuevo Cliente"
        }
        className="!w-full !max-w-2xl"
      >
        <CreateClientWizard
          clientToEdit={editingClient || undefined}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingClient(null);
          }}
          onSuccess={handleSuccess}
        />
      </ITDialog>

      <ITDialog
        isOpen={!!clientToDeleteId}
        onClose={() => setClientToDeleteId(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-6">
          <p className="text-slate-700 mb-6">
            ¿Estás seguro de eliminar el cliente seleccionado? Esto no eliminará
            sus datos históricos, pero lo ocultará del sistema principal.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              onClick={() => setClientToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="outlined"
              color="danger"
              className="bg-red-600 text-white border-red-600"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Cliente"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default ClientsPage;
