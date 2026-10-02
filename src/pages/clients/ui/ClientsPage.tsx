import { ITBadget, ITButton, ITDataTable, ITDialog, ITText, ITTripleFilter } from "@axzydev/axzy_ui_system";
import { FaBuilding, FaEdit, FaSearchLocation, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { Client } from "@entities/client";
import { ConfirmDialog, PageShell } from "@shared/ui";
import { useClientsDeps } from "../model/deps";
import { clientInitials, useClientsPage } from "../model/useClientsPage";
import { CreateClientWizard } from "./CreateClientWizard";

/** Directorio de clientes. Sólo pinta: el estado vive en `useClientsPage`. */
const ClientsPage = () => {
  const navigate = useNavigate();
  const {
    refreshKey,
    refreshTable,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    externalFilters,
    memoizedFetch,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingClient,
    setEditingClient,
    clientToDeleteId,
    setClientToDeleteId,
    isDeleting,
    confirmDelete,
    handleSuccess,
  } = useClientsPage(useClientsDeps());

  const getInitials = clientInitials;

  return (
    <PageShell
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
    >

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
                <ITBadget color={row.active ? "success" : "danger"} size="sm">
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
                    size="sm"
                    variant="outlined"
                    title="Ver Detalles"
                  >
                    <FaSearchLocation size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => setEditingClient(row)}
                    size="sm"
                    variant="outlined"
                    color="info"
                    title="Editar"
                  >
                    <FaEdit size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => setClientToDeleteId(row.id)}
                    size="sm"
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
        className="!max-w-lg w-full!"
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

      <ConfirmDialog
        isOpen={!!clientToDeleteId}
        onClose={() => setClientToDeleteId(null)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        variant="danger"
        title="Eliminar cliente"
        message="Se eliminará el cliente y todos sus datos asociados de forma permanente."
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default ClientsPage;
