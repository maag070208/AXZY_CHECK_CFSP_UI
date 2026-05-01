import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaClock, FaEdit, FaPlus, FaSearchLocation, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CreateClientWizard } from "../components/CreateClientWizard";
import { Client, deleteClient, getPaginatedClients } from "../services/ClientsService";

const ClientsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientToDeleteId, setClientToDeleteId] = useState<number | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const externalFilters = useMemo(() => {
        return { name: searchTerm };
    }, [searchTerm]);

    const memoizedFetch = useCallback((params: any) => {
        return getPaginatedClients(params);
    }, []);

    const refreshTable = () => setRefreshKey(prev => prev + 1);

    const handleSuccess = () => {
        setIsCreateModalOpen(false);
        setEditingClient(null);
        refreshTable();
    };

    const confirmDelete = async () => {
        if (!clientToDeleteId) return;
        try {
            await deleteClient(clientToDeleteId);
            dispatch(showToast({ message: "Cliente eliminado", type: "success" }));
            refreshTable();
        } catch (error) {
            dispatch(showToast({ message: "Error al eliminar cliente", type: "error" }));
        } finally {
            setClientToDeleteId(null);
        }
    };

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen">
            {/* Header following the screenshot exactly */}
            <div className="flex justify-between items-center mb-8">
                <div>
                   <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <FaBuilding className="text-emerald-600" />
                        Directorio de Clientes
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">Gestión de clientes y sus ubicaciones</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-64 relative">
                        <input 
                            type="text"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full py-2 h-[42px] px-4 pr-10 bg-white border border-slate-100 rounded-xl outline-none text-sm focus:border-emerald-500 transition-all shadow-sm font-medium text-slate-600"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>
                    <ITButton
                        onClick={refreshTable}
                        color="secondary"
                        variant="outlined"
                        className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        size="small"
                    >
                        <FaSync className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? '' : 'rotate-180'}`} />
                        <span className="text-xs font-bold text-slate-500">Actualizar</span>
                    </ITButton>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                    >
                        <FaPlus className="text-xs" />
                        <span>Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable
                    key={refreshKey}
                    fetchData={memoizedFetch as any}
                    externalFilters={externalFilters}
                    defaultItemsPerPage={10}
                    title=""
                    columns={[
                        {
                            key: "id",
                            label: "ID",
                            type: "string",
                            sortable: true,
                        },
                        {
                            key: "name",
                            label: "CLIENTE",
                            type: "string",
                            sortable: true,
                            render: (row: Client) => (
                                <div className="font-bold text-slate-800">{row.name}</div>
                            )
                        },
                        {
                            key: "locations",
                            label: "UBICACIONES",
                            type: "string",
                            render: (row: Client) => (
                                <div className="flex items-center gap-4">
                                    <div className="font-medium text-slate-600">{row._count?.locations || 0} ubicaciones registradas</div>
                                    <ITButton 
                                        onClick={() => navigate(`/locations?clientId=${row.id}`)}
                                        size="small"
                                        variant="outlined"
                                        className="h-8 px-3 !rounded-lg border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2"
                                    >
                                        <FaSearchLocation className="text-[10px]" />
                                        <span className="text-[10px] font-bold">Ubicaciones</span>
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => navigate(`/rounds?clientId=${row.id}`)}
                                        size="small"
                                        variant="outlined"
                                        className="h-8 px-3 !rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
                                    >
                                        <FaClock className="text-[10px]" />
                                        <span className="text-[10px] font-bold">Rondas</span>
                                    </ITButton>
                                </div>
                            )
                        },
                        {
                            key: "contact",
                            label: "CONTACTO",
                            type: "string",
                            render: (row: Client) => (
                                <div className="text-xs">
                                    <div className="font-bold text-slate-700">{row.contactName || '-'}</div>
                                    <div className="text-slate-500">{row.contactPhone || ''}</div>
                                </div>
                            )
                        },
                        {
                            key: "status",
                            label: "ESTADO",
                            type: "string",
                            render: (row: Client) => (
                                <div className="text-sm text-slate-600">
                                    <div className={`flex items-center gap-1.5 font-medium ${row.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        {row.active ? 'Activo' : 'Inactivo'}
                                    </div>
                                </div>
                            )
                        },
                        {
                            key: "actions",
                            label: "ACCIONES",
                            type: "actions",
                            actions: (row: Client) => (
                                <div className="flex items-center gap-2">
                                    <ITButton 
                                        onClick={() => setEditingClient(row)} 
                                        size="small" 
                                        variant="ghost" 
                                        className="text-slate-400 hover:text-slate-600"
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </ITButton>
                                    <ITButton 
                                        onClick={() => setClientToDeleteId(row.id)} 
                                        size="small" 
                                        variant="ghost" 
                                        className="text-red-300 hover:text-red-500"
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </ITButton>
                                </div>
                            )
                        }
                    ] as any}
                />
            </div>

            {/* Modals matching the high-end style */}
            <ITDialog 
                isOpen={isCreateModalOpen || !!editingClient} 
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingClient(null);
                }} 
                title={editingClient ? `Editar Cliente: ${editingClient.name}` : "Nuevo Cliente"}
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
                    <p className="text-slate-700 mb-6">¿Estás seguro de eliminar el cliente seleccionado? Esto no eliminará sus datos históricos, pero lo ocultará del sistema principal.</p>
                    <div className="flex justify-end gap-3">
                        <ITButton variant="outlined" onClick={() => setClientToDeleteId(null)}>Cancelar</ITButton>
                        <ITButton className="bg-red-600 text-white border-red-600" onClick={confirmDelete}>Eliminar Cliente</ITButton>
                    </div>
                </div>
            </ITDialog>
        </div>
    );
};

export default ClientsPage;
