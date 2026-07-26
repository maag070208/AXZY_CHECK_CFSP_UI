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
  ITLoader,
  ITText,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaSearchLocation, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CreateClientWizard } from "../components/CreateClientWizard";
import {
  Client,
  deleteClient,
  getPaginatedClients,
} from "../services/ClientsService";

const getInitials = (name?: string | null) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "??";
};

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
    <div className="p-6 min-h-screen font-sans">
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

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
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
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => navigate(`/clients/${row.id}`)}
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:border-primary-100 transition-colors">
                    {getInitials(row.name)}
                  </div>
                  <div className="min-w-0">
                    <ITText className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1 group-hover:text-primary-600 transition-colors block">
                      {row.name}
                    </ITText>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary-400 transition-colors" />
                      <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                        ID: {row.id.substring(0, 8).toUpperCase()}
                      </ITText>
                    </div>
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
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
                    {row.contactName || "SIN CONTACTO"}
                  </ITText>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                    <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
                      TEL: {row.contactPhone || "N/A"}
                    </ITText>
                  </div>
                </div>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: Client) => (
                <ITBadget color={row.active ? "success" : "danger"} size="small">
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
                    color="info"
                    title="Editar"
                  >
                    <FaEdit size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => setClientToDeleteId(row.id)}
                    size="small"
                    variant="outlined"
                    color="danger"
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

      {/* Create / Edit Modal */}
      <ITDialog
        isOpen={isCreateModalOpen || !!editingClient}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingClient(null);
        }}
        title=""
        className="!max-w-lg !w-full"
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

      {/* Delete confirmation dialog — aligned with DESIGN_STANDARDS §6 */}
      <ITDialog
        isOpen={!!clientToDeleteId}
        onClose={() => setClientToDeleteId(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-danger-50 text-danger-500 flex items-center justify-center mx-auto mb-8 border border-danger-100 shadow-sm">
            <FaTrash size={28} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3 block">
            ¿Eliminar Cliente?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción eliminará el cliente y todos sus datos asociados de
            forma permanente.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setClientToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-danger-200"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "CONFIRMAR ACCIÓN"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default ClientsPage;
