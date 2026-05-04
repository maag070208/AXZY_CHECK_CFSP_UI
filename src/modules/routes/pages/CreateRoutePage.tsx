import { post } from "@app/core/axios/axios";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITInput,
  ITLoader,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaInfoCircle,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRoute,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { getUsers, User } from "../../users/services/UserService";
import {
  createRoute,
  getRouteById,
  ILocationCreate,
  updateRoute,
} from "../services/RoutesService";

const CreateRoutePage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- States (Mantenidos igual para asegurar funcionalidad) ---
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allGuards, setAllGuards] = useState<User[]>([]);
  const [clientZones, setClientZones] = useState<any[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | number>("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const { data: clients } = useCatalog("client");

  // --- Logic (Mantenida igual) ---
  useEffect(() => {
    fetchInitialData();
    if (isEditing) fetchFullData(id);
  }, [id]);

  useEffect(() => {
    if (selectedClientId) fetchZones(String(selectedClientId));
    else {
      setClientZones([]);
      setSelectedZoneId("");
    }
  }, [selectedClientId]);

  const fetchZones = async (clientId: string) => {
    try {
      const res = await post<any>("/zones/datatable", {
        filters: { clientId },
      });
      if (res.success && res.data) setClientZones(res.data.rows || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFullData = async (routeId: string) => {
    setFetchingData(true);
    try {
      const res = await getRouteById(routeId);
      if (res.success && res.data) {
        const data = res.data;
        setTitle(data.title);
        setAddedLocations(
          (data.recurringLocations || []).map((rl: any) => ({
            locationId: rl.location?.id,
            locationName: rl.location?.name,
            tasks: (rl.tasks || []).map((t: any) => ({
              description: t.description,
              reqPhoto: t.reqPhoto,
            })),
          })),
        );
        setSelectedGuards(data.guards?.map((g: any) => g.id) || []);
        if (data.recurringLocations?.[0]?.location?.clientId)
          setSelectedClientId(data.recurringLocations[0].location.clientId);
        if (data.recurringLocations?.[0]?.location?.zoneId)
          setSelectedZoneId(data.recurringLocations[0].location.zoneId);
      }
    } catch (e) {
      dispatch(showToast({ message: "Error al cargar datos", type: "error" }));
    } finally {
      setFetchingData(false);
    }
  };

  const fetchInitialData = async () => {
    const [locRes, usersRes] = await Promise.all([getLocations(), getUsers()]);
    if (locRes.success) setAllLocations(locRes.data);
    if (usersRes.success) {
      setAllGuards(
        usersRes.data.filter((u) => {
          const role = typeof u.role === "object" ? u.role.name : u.role;
          return ["GUARD", "SHIFT", "MAINT"].includes(role) && u.active;
        }),
      );
    }
  };

  const handleAddLocation = () => {
    if (addedLocations.find((l) => l.locationId === selectedLocId)) return;
    const locObj = allLocations.find(
      (l) => String(l.id) === String(selectedLocId),
    );
    if (!locObj) return;
    setAddedLocations([
      ...addedLocations,
      { locationId: selectedLocId, locationName: locObj.name, tasks: [] },
    ]);
    setSelectedLocId("");
  };

  const handleBulkAddByZone = () => {
    const zoneLocs = allLocations.filter(
      (l) =>
        String(l.zoneId) === String(selectedZoneId) &&
        !addedLocations.find((al) => al.locationId === l.id),
    );
    if (zoneLocs.length === 0) return;
    setAddedLocations([
      ...addedLocations,
      ...zoneLocs.map((l) => ({
        locationId: l.id,
        locationName: l.name,
        tasks: [],
      })),
    ]);
    setSelectedZoneId("");
  };

  const handleTaskChange = (locIdx: number, taskIdx: number, val: string) => {
    const copy = [...addedLocations];
    copy[locIdx].tasks[taskIdx].description = val;
    setAddedLocations(copy);
  };

  const handleAddTask = (idx: number) => {
    const copy = [...addedLocations];
    copy[idx].tasks.push({ description: "", reqPhoto: false });
    setAddedLocations(copy);
  };

  const toggleGuard = (id: string) => {
    setSelectedGuards((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const filteredGuards = useMemo(
    () =>
      allGuards.filter(
        (g) =>
          !selectedClientId || String(g.clientId) === String(selectedClientId),
      ),
    [allGuards, selectedClientId],
  );
  const availableLocations = useMemo(
    () =>
      allLocations.filter(
        (l) =>
          !addedLocations.find((al) => al.locationId === l.id) &&
          (!selectedClientId ||
            String(l.clientId) === String(selectedClientId)),
      ),
    [allLocations, addedLocations, selectedClientId],
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        title,
        clientId: selectedClientId,
        locations: addedLocations,
        guardIds: selectedGuards,
      };
      const res = isEditing
        ? await updateRoute(id!, payload)
        : await createRoute(payload);
      if (res.success) {
        dispatch(showToast({ message: "Ruta guardada", type: "success" }));
        navigate("/routes");
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Identificación",
      icon: <FaInfoCircle />,
      isValid: !!title && !!selectedClientId,
    },
    {
      title: "Puntos de Control",
      icon: <FaMapMarkerAlt />,
      isValid: addedLocations.length > 0,
    },
    {
      title: "Asignación",
      icon: <FaUserFriends />,
      isValid: selectedGuards.length > 0,
    },
    { title: "Resumen", icon: <FaClipboardCheck />, isValid: true },
  ];

  if (fetchingData)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <ITLoader size="lg" />
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
          Sincronizando datos...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans">
      {/* Header Estilizado */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/routes")}
              className="group p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all"
            >
              <FaChevronLeft className="text-slate-400 group-hover:text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                {isEditing ? "EDITAR RUTA" : "CONFIGURAR RUTA"}
              </h1>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                {steps[currentStep].title}
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center bg-slate-100 p-1.5 rounded-2xl">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all ${currentStep === idx ? "bg-white shadow-sm text-slate-800" : "text-slate-400"}`}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${currentStep >= idx ? "bg-emerald-500 text-white" : "bg-slate-200"}`}
                >
                  {currentStep > idx ? <FaCheck /> : idx + 1}
                </span>
                <span className="text-xs font-bold uppercase tracking-tight">
                  {step.title}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
            <div className="flex-1 p-8 md:p-12">
              {/* STEP 1: IDENTIFICACIÓN */}
              {currentStep === 0 && (
                <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="text-center space-y-2 mb-10">
                    <div className="inline-flex p-4 rounded-3xl bg-emerald-50 text-emerald-600 mb-4">
                      <FaInfoCircle size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800">
                      Información Primaria
                    </h2>
                    <p className="text-slate-500">
                      Comienza definiendo los datos generales de la operación.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <ITInput
                      label="Nombre de la Ruta"
                      placeholder="Ej. Perímetro Planta Norte"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      name=""
                      onBlur={() => {}}
                    />
                    <ITSearchSelect
                      label="Cliente"
                      placeholder="Seleccionar cliente..."
                      options={
                        clients?.map((c: any) => ({
                          label: c.name,
                          value: c.id,
                        })) || []
                      }
                      value={selectedClientId}
                      onChange={(val) => {
                        setSelectedClientId(val);
                        setSelectedZoneId("");
                        setAddedLocations([]);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: PUNTOS DE CONTROL - REDISEÑADO A 2 COLUMNAS */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full animate-in fade-in duration-500">
                  {/* Selector Lateral */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                      <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                        <FaPlus className="text-emerald-500" /> Añadir Puntos
                      </h3>
                      <ITSearchSelect
                        label="Por Zona"
                        options={clientZones.map((z) => ({
                          label: z.name,
                          value: z.id,
                        }))}
                        value={selectedZoneId}
                        onChange={setSelectedZoneId}
                      />
                      <ITButton
                        onClick={handleBulkAddByZone}
                        disabled={!selectedZoneId}
                        className="w-full !rounded-xl !bg-white !text-slate-700 !border-slate-200 shadow-sm"
                      >
                        Añadir Zona
                      </ITButton>
                      <div className="h-px bg-slate-200 mx-2" />
                      <ITSearchSelect
                        label="Ubicación Individual"
                        options={availableLocations.map((l) => ({
                          label: l.name,
                          value: l.id,
                        }))}
                        value={selectedLocId}
                        onChange={setSelectedLocId}
                      />
                      <ITButton
                        onClick={handleAddLocation}
                        disabled={!selectedLocId}
                        className="w-full !rounded-xl !bg-emerald-600"
                      >
                        Añadir Punto
                      </ITButton>
                    </div>
                  </div>

                  {/* Lista de Puntos Agregados */}
                  <div className="lg:col-span-8 flex flex-col">
                    <div className="flex justify-between items-end mb-4 px-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Hoja de Ruta ({addedLocations.length})
                      </h3>
                      {addedLocations.length > 0 && (
                        <button
                          onClick={() => setAddedLocations([])}
                          className="text-[10px] font-bold text-rose-500 uppercase hover:underline"
                        >
                          Borrar todo
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[500px] space-y-4 pr-4 custom-scrollbar">
                      {addedLocations.map((loc, idx) => (
                        <div
                          key={loc.locationId}
                          className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-emerald-300 transition-colors shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-700 uppercase text-sm">
                                {loc.locationName}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                setAddedLocations(
                                  addedLocations.filter((_, i) => i !== idx),
                                )
                              }
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {loc.tasks.map((task, tIdx) => (
                              <div
                                key={tIdx}
                                className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100"
                              >
                                <input
                                  className="flex-1 bg-transparent text-xs outline-none px-2 font-medium"
                                  placeholder="Describa la tarea..."
                                  value={task.description}
                                  onChange={(e) =>
                                    handleTaskChange(idx, tIdx, e.target.value)
                                  }
                                />
                                <button
                                  onClick={() => {
                                    const copy = [...addedLocations];
                                    copy[idx].tasks.splice(tIdx, 1);
                                    setAddedLocations(copy);
                                  }}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <FaMinus size={10} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => handleAddTask(idx)}
                              className="border-2 border-dashed border-slate-200 rounded-xl py-2 text-[10px] font-bold text-slate-400 hover:bg-slate-50 hover:border-emerald-200 transition-all flex items-center justify-center gap-2"
                            >
                              <FaPlus size={8} /> AGREGAR TAREA
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PERSONAL */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center bg-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">
                        Personal Responsable
                      </h2>
                      <p className="text-slate-400 text-sm">
                        Selecciona los guardias habilitados para esta ruta.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-3xl font-black text-emerald-400 leading-none">
                        {selectedGuards.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Seleccionados
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredGuards.map((guard) => (
                      <div
                        key={guard.id}
                        onClick={() => toggleGuard(guard.id)}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${selectedGuards.includes(guard.id) ? "bg-emerald-50 border-emerald-500 shadow-md" : "bg-white border-slate-100 hover:border-slate-200"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${selectedGuards.includes(guard.id) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}
                        >
                          {guard.name[0]}
                          {guard.lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-700 uppercase leading-none mb-1">
                            {guard.name} {guard.lastName}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            ID: {guard.id.slice(-6)}
                          </p>
                        </div>
                        {selectedGuards.includes(guard.id) && (
                          <FaCheck className="text-emerald-500" size={12} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: RESUMEN FINAL */}
              {currentStep === 3 && (
                <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
                  <div className="bg-[#F8FAFC] border-2 border-slate-200 rounded-[3rem] p-10 relative">
                    <div className="absolute top-8 right-10 text-slate-100">
                      <FaRoute size={80} />
                    </div>

                    <div className="space-y-10 relative z-10">
                      <div className="border-b border-slate-200 pb-6">
                        <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
                          {title}
                        </h2>
                        <p className="text-emerald-600 font-bold uppercase text-xs tracking-[0.3em] mt-2">
                          Resumen de Configuración
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Cliente Operativo
                          </h4>
                          <p className="font-bold text-slate-700">
                            {
                              clients?.find(
                                (c) =>
                                  String(c.id) === String(selectedClientId),
                              )?.name
                            }
                          </p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Total Paradas
                          </h4>
                          <p className="font-bold text-slate-700">
                            {addedLocations.length} Ubicaciones
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Personal Asignado
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedGuards.map((id) => (
                            <span
                              key={id}
                              className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-600 uppercase"
                            >
                              {allGuards.find((g) => g.id === id)?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer de Navegación */}
            <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
              <ITButton
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 0}
                className="!bg-transparent !text-slate-400 !border-none !shadow-none hover:!text-slate-800 disabled:!opacity-0"
              >
                <div className="flex items-center gap-2 font-bold uppercase text-xs tracking-widest">
                  <FaChevronLeft /> Anterior
                </div>
              </ITButton>

              <div className="flex gap-4">
                {currentStep < steps.length - 1 ? (
                  <ITButton
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    disabled={!steps[currentStep].isValid}
                    className="!rounded-2xl !px-10 !h-[50px] !bg-slate-800 shadow-lg shadow-slate-200 font-bold text-xs uppercase tracking-widest"
                  >
                    Siguiente Paso
                  </ITButton>
                ) : (
                  <ITButton
                    onClick={handleSave}
                    disabled={loading}
                    className="!rounded-2xl !px-12 !h-[50px] !bg-emerald-600 shadow-lg shadow-emerald-200 font-black text-xs uppercase tracking-widest"
                  >
                    {loading ? "GUARDANDO..." : "CONFIRMAR Y GUARDAR"}
                  </ITButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Estilos Globales para Scrollbars */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `,
        }}
      />
    </div>
  );
};

export default CreateRoutePage;
