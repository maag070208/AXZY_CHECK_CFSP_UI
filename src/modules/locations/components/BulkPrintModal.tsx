import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITSearchSelect, ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState, useMemo } from "react";
import { FaBuilding, FaLayerGroup, FaPrint, FaSearch, FaFilter } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getLocations, Location } from "../service/locations.service";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { post } from "@app/core/axios/axios";

interface BulkPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BulkPrintModal = ({ isOpen, onClose }: BulkPrintModalProps) => {
    const dispatch = useDispatch();
    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string | number>("");
    const [selectedZoneId, setSelectedZoneId] = useState<string | number>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [clientZones, setClientZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const { data: clients } = useCatalog("client");

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
            setSelectedIds([]);
            setSearchTerm("");
            setSelectedClientId("");
            setSelectedZoneId("");
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedClientId) {
            fetchZones(Number(selectedClientId));
        } else {
            setClientZones([]);
            setSelectedZoneId("");
        }
    }, [selectedClientId]);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await getLocations();
            if (res.success && res.data) {
                setAllLocations(res.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchZones = async (clientId: number) => {
        try {
            const res = await post<any>("/zones/datatable", { filters: { clientId } });
            if (res.success && res.data) {
                setClientZones(res.data.rows || []);
            }
        } catch (error) {
            console.error("Error fetching zones", error);
        }
    };

    const isFiltered = useMemo(() => {
        return !!selectedClientId || !!selectedZoneId || !!searchTerm;
    }, [selectedClientId, selectedZoneId, searchTerm]);

    const filteredLocations = useMemo(() => {
        if (!isFiltered) return [];
        return allLocations.filter(l => {
            if (selectedClientId && l.clientId !== Number(selectedClientId)) return false;
            if (selectedZoneId && l.zoneId !== Number(selectedZoneId)) return false;
            if (searchTerm && !l.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [allLocations, selectedClientId, selectedZoneId, searchTerm, isFiltered]);

    const handleToggleAll = () => {
        if (selectedIds.length === filteredLocations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredLocations.map(l => l.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handlePrint = async () => {
        if (selectedIds.length === 0) {
            dispatch(showToast({ message: "Selecciona al menos una ubicación", type: "warning" }));
            return;
        }
        setIsPrinting(true);
        try {
            const res = await post<any>("/locations/print-qrs", { ids: selectedIds }, { responseType: 'blob' });
            const blob = new Blob([res as any], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `qrs_${selectedIds.length}_puntos.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            dispatch(showToast({ message: "PDF generado correctamente", type: "success" }));
        } catch (error) {
            dispatch(showToast({ message: "Error al generar el PDF masivo", type: "error" }));
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <ITDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Impresión Masiva de QRs"
            className="!w-full !max-w-4xl !rounded-3xl"
        >
            <div className="flex flex-col gap-6 max-h-[80vh] overflow-hidden p-1">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                            <FaBuilding className="text-[9px]" /> Cliente
                        </label>
                        <ITSearchSelect
                            placeholder="Todos los clientes"
                            options={(clients || []).map((c: any) => ({ label: c.name, value: c.id }))}
                            value={selectedClientId}
                            onChange={(val) => {
                                setSelectedClientId(val);
                                setSelectedZoneId("");
                            }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                            <FaLayerGroup className="text-[9px]" /> Recurrente (Zona)
                        </label>
                        <ITSearchSelect
                            placeholder="Todas las zonas"
                            options={clientZones.map(z => ({ label: z.name, value: z.id }))}
                            value={selectedZoneId}
                            onChange={(val) => setSelectedZoneId(val)}
                            disabled={!selectedClientId}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                            <FaSearch className="text-[9px]" /> Buscar por nombre
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                className="w-full h-[42px] px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all bg-white"
                                placeholder="Filtrar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* List Header */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                            {isFiltered ? `Ubicaciones (${filteredLocations.length})` : 'Ubicaciones'}
                        </h4>
                        {isFiltered && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {selectedIds.length} seleccionadas
                            </span>
                        )}
                    </div>
                    {isFiltered && (
                        <button 
                            onClick={handleToggleAll}
                            className="text-emerald-600 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                        >
                            {selectedIds.length === filteredLocations.length && filteredLocations.length > 0 ? 'Desmarcar Todos' : 'Seleccionar Todo en Filtro'}
                        </button>
                    )}
                </div>

                {/* Locations List */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[350px]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center py-20">
                            <ITLoader />
                        </div>
                    ) : !isFiltered ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-60 py-20">
                            <FaFilter size={40} />
                            <p className="font-black text-sm uppercase tracking-widest">Selecciona un cliente o zona para comenzar</p>
                        </div>
                    ) : filteredLocations.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-60 py-20">
                            <FaSearch size={40} />
                            <p className="font-bold text-sm uppercase tracking-widest">No se encontraron ubicaciones</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                            {filteredLocations.map(loc => (
                                <div 
                                    key={loc.id}
                                    onClick={() => toggleSelection(loc.id)}
                                    className={`
                                        cursor-pointer p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200
                                        ${selectedIds.includes(loc.id) 
                                            ? 'bg-emerald-50/50 border-emerald-500 shadow-sm' 
                                            : 'bg-white border-slate-50 hover:border-slate-200'}
                                    `}
                                >
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(loc.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 bg-white'}`}>
                                         {selectedIds.includes(loc.id) && <FaPrint className="text-white text-[10px]" />}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className={`text-sm font-black tracking-tight leading-tight ${selectedIds.includes(loc.id) ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {loc.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            ID: {loc.id} • {loc.client?.name || 'Sin Cliente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <ITButton 
                        onClick={onClose} 
                        variant="outlined" 
                        color="secondary" 
                        className="!rounded-xl font-bold text-xs uppercase tracking-widest !border-slate-200 !text-slate-400 hover:!bg-slate-50"
                    >
                        Cancelar
                    </ITButton>
                    <ITButton 
                        onClick={handlePrint} 
                        color="primary"
                        disabled={isPrinting || selectedIds.length === 0}
                        className="!rounded-xl !bg-emerald-600 font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-50 hover:!bg-emerald-700 disabled:opacity-40"
                    >
                        {isPrinting ? "Generando..." : `Imprimir ${selectedIds.length} QRs`}
                    </ITButton>
                </div>
            </div>
        </ITDialog>
    );
};
