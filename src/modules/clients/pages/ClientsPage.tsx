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
    <div className="p-6   min-h-screen">
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
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 hover:text-sky-600 cursor-pointer transition-colors block">
                    {row.name}
                  </ITText>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      ID: {row.id.substring(0, 8).toUpperCase()}
                    </ITText>
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
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    {row.contactName || "SIN CONTACTO"}
                  </ITText>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
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
                <ITBadget color={row.active ? "primary" : "error"} size="small">
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

      {/* DELETE CLIENT DIALOG */}
      <ITDialog
        isOpen={!!clientToDeleteId}
        onClose={() => setClientToDeleteId(null)}
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
                <h3 className="text-base font-medium text-slate-800">Eliminar Cliente</h3>
                <p className="text-xs text-slate-400 font-light">Cliente #{clientToDeleteId}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el cliente y todos sus datos asociados de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setClientToDeleteId(null)}
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
    </div>
  );
};

export default ClientsPage;
