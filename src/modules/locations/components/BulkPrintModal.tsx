import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITSearchSelect,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaMapMarkerAlt, FaPlus, FaPrint, FaSearch, FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { Zone, getZones } from "../../zones/services/ZonesService";
import { Location, getPaginatedLocations } from "../service/locations.service";

interface BulkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  initialClientId?: string;
}

export const BulkPrintModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialClientId,
}: BulkPrintModalProps) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<"SEARCH" | "SELECTED">("SEARCH");
  const [clientId, setClientId] = useState(initialClientId || "");
  const [bulkFilterZone, setBulkFilterZone] = useState<string>("");
  const [bulkFilterSearch, setBulkFilterSearch] = useState<string>("");
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [locationsToChoose, setLocationsToChoose] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [animateBadge, setAnimateBadge] = useState(false);

  const { data: clients } = useCatalog("client");

  useEffect(() => {
    if (selectedIds.length > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedIds.length]);

  const fetchBulkLocations = useCallback(async () => {
    const res = await getPaginatedLocations({
      page: 1,
      limit: 1000,
      filters: {
        name: bulkFilterSearch || undefined,
        zoneId: bulkFilterZone || undefined,
        clientId: clientId || undefined,
      },
    });
    if (res.data) {
      setLocationsToChoose(res.data);
    }
  }, [bulkFilterSearch, bulkFilterZone, clientId]);

  useEffect(() => {
    if (isOpen) {
      getZones().then((res) => {
        if (res.success) setAllZones(res.data || []);
      });
      fetchBulkLocations();
    }
  }, [isOpen, fetchBulkLocations]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(fetchBulkLocations, 300);
      return () => clearTimeout(timer);
    }
  }, [bulkFilterSearch, bulkFilterZone, isOpen, fetchBulkLocations]);

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      dispatch(
        showToast({
          message: "Selecciona al menos una ubicación",
          type: "warning",
        }),
      );
      return;
    }
    onConfirm(selectedIds);
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="!max-w-4xl !w-full"
    >
      <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">
        <div className="px-8 pt-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
              <FaPrint size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-800">Impresión Masiva</h3>
              <p className="text-xs text-slate-400 font-light">Generar QRs</p>
            </div>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="flex-none flex px-8 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab("SEARCH")}
            className={`px-8 py-5 text-[10px] font-medium tracking-[0.2em] transition-all border-b-2 uppercase ${activeTab === "SEARCH"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            Buscar y Agregar
          </button>
          <button
            onClick={() => setActiveTab("SELECTED")}
            className={`px-8 py-5 text-[10px] font-medium tracking-[0.2em] transition-all border-b-2 flex items-center gap-3 uppercase ${activeTab === "SELECTED"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            Seleccionados
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all duration-300 ${animateBadge ? "scale-125 bg-emerald-500 text-white" : ""} ${selectedIds.length > 0
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-400"
                }`}
            >
              {selectedIds.length}
            </span>
          </button>
        </div>

        {/* Filters Section (Only in SEARCH tab) */}
        {activeTab === "SEARCH" && (
          <div className="flex-none px-8 py-5 bg-slate-50/30 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Cliente
                </label>
                <ITSearchSelect
                  placeholder="Seleccionar cliente..."
                  options={(clients || []).map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  value={clientId}
                  onChange={(val) => {
                    setClientId(val as string);
                    setBulkFilterZone("");
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Zona / Recurrente
                </label>
                <ITSelect
                  value={bulkFilterZone}
                  onChange={(e) => setBulkFilterZone(e.target.value)}
                  disabled={!clientId}
                  options={[
                    { label: "Todas las zonas", value: "" },
                    ...allZones.map((z) => ({
                      label: z.name,
                      value: z.id,
                    })),
                  ]}
                  name=""
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  Buscador
                </label>
                <ITInput
                  placeholder="Ej. Punto de Control A..."
                  name="bulkSearch"
                  value={bulkFilterSearch}
                  onChange={(e) => setBulkFilterSearch(e.target.value)}
                  onBlur={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  {activeTab === "SEARCH"
                    ? "Resultados de Búsqueda"
                    : "Elementos a Imprimir"}
                </h4>
              </div>

              {activeTab === "SEARCH" && locationsToChoose.length > 0 && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      const newLocations = locationsToChoose.filter(
                        (l) => !selectedIds.includes(l.id),
                      );
                      setSelectedIds([
                        ...selectedIds,
                        ...newLocations.map((l) => l.id),
                      ]);
                      setSelectedLocations([
                        ...selectedLocations,
                        ...newLocations,
                      ]);
                    }}
                    className="text-[9px] font-medium text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                  >
                    Agregar Todos
                  </button>
                  <div className="w-px h-3 bg-slate-200" />
                  <button
                    onClick={() => {
                      setSelectedIds([]);
                      setSelectedLocations([]);
                    }}
                    className="text-[9px] font-medium text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Limpiar Selección
                  </button>
                </div>
              )}
            </div>

            {activeTab === "SEARCH" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationsToChoose.length > 0 ? (
                  locationsToChoose.map((loc) => (
                    <label
                      key={loc.id}
                      className={`group flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${selectedIds.includes(loc.id)
                        ? "border-emerald-500 bg-emerald-50/30 shadow-sm"
                        : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(loc.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, loc.id]);
                            setSelectedLocations([...selectedLocations, loc]);
                          } else {
                            setSelectedIds(
                              selectedIds.filter((id) => id !== loc.id),
                            );
                            setSelectedLocations(
                              selectedLocations.filter((l) => l.id !== loc.id),
                            );
                          }
                        }}
                        className="hidden"
                      />
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(loc.id)
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-200 bg-white group-hover:border-slate-300"
                          }`}
                      >
                        {selectedIds.includes(loc.id) && (
                          <FaPlus size={8} className="rotate-45" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-slate-700 truncate uppercase tracking-tight">
                          {loc.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div
                            className={`w-1 h-1 rounded-full ${selectedIds.includes(loc.id) ? "bg-emerald-400" : "bg-slate-300"}`}
                          />
                          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest truncate">
                            {loc.zone?.name || "General"}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                    <FaSearch size={40} className="opacity-20" />
                    <span className="text-[9px] font-medium uppercase tracking-widest">
                      Sin resultados encontrados
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedLocations.length > 0 ? (
                  selectedLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className="flex items-center justify-between p-5 rounded-2xl border border-emerald-500 bg-emerald-50/30 shadow-sm"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-slate-700 truncate uppercase tracking-tight">
                          {loc.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-400" />
                          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-widest truncate">
                            {loc.zone?.name || "General"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedIds(
                            selectedIds.filter((id) => id !== loc.id),
                          );
                          setSelectedLocations(
                            selectedLocations.filter((l) => l.id !== loc.id),
                          );
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                    <FaMapMarkerAlt size={40} className="opacity-20" />
                    <span className="text-[9px] font-medium uppercase tracking-widest">
                      No hay ubicaciones seleccionadas
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
          <ITButton
            variant="ghost"
            size="small"
            onClick={onClose}
            className="px-5 whitespace-nowrap shadow shadow-slate-100"
          >
            Cancelar
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            size="small"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className="px-5 whitespace-nowrap shadow shadow-sky-100"
          >
            Confirmar Impresión ({selectedIds.length})
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
