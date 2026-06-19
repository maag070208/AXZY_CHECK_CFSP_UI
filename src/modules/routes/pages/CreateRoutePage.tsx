import { useCatalog } from "@app/core/hooks/catalog.hook";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
  ITSlideToggle,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaChevronUp,
  FaClipboardCheck,
  FaCopy,
  FaInfoCircle,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaPlus,
  FaRoute,
  FaSearch,
  FaTrash,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { CreateUserWizard } from "../../users/components/CreateUserWizard";
import { getUsers, User } from "../../users/services/UserService";
import { getZonesByClient } from "../../zones/services/ZonesService";
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
  const { colors } = useITTheme();
  const primary = colors.primary || "#10b981";
  const primaryLight = primary + "15";

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
  const [fetchingData, setFetchingData] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [active, setActive] = useState(true);
  const [guardSearch, setGuardSearch] = useState("");
  const [showClearDialog, setShowClearDialog] = useState(false);

  const { data: clients } = useCatalog("client");

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
    setLoadingZones(true);
    try {
      const zones = await getZonesByClient(clientId);
      setClientZones(zones || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchFullData = async (routeId: string) => {
    setFetchingData(true);
    try {
      const res = await getRouteById(routeId);
      if (res.success && res.data) {
        const data = res.data;
        setTitle(data.title);
        setActive(data.active ?? true);
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
        usersRes.data?.filter((u: any) => {
          const role = typeof u.role === "object" ? u.role.name : u.role;
          return ["GUARD", "SHIFT", "MAINT"].includes(role) && u.active;
        }) || [],
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
        !addedLocations.find((al) => al.locationId === (l.id as any)),
    );
    if (zoneLocs.length === 0) return;
    setAddedLocations([
      ...addedLocations,
      ...zoneLocs.map((l) => ({
        locationId: l.id as any,
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

  const handleCloneTasks = (idx: number) => {
    const sourceTasks = [...addedLocations[idx].tasks];
    setAddedLocations(
      addedLocations.map((loc) => ({
        ...loc,
        tasks: sourceTasks.map((t) => ({ ...t })),
      })),
    );
    dispatch(
      showToast({
        message: "Tareas clonadas a todos los puntos",
        type: "info",
      }),
    );
  };

  const moveLocation = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= addedLocations.length) return;
    const copy = [...addedLocations];
    const item = copy[idx];
    copy.splice(idx, 1);
    copy.splice(newIdx, 0, item);
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
          (!selectedClientId ||
            String(g.clientId) === String(selectedClientId) ||
            !g.clientId) &&
          (g.name.toLowerCase().includes(guardSearch.toLowerCase()) ||
            g.lastName?.toLowerCase().includes(guardSearch.toLowerCase())),
      ),
    [allGuards, selectedClientId, guardSearch],
  );

  const availableLocations = useMemo(
    () =>
      allLocations.filter(
        (l) =>
          !addedLocations.find((al) => al.locationId === (l.id as any)) &&
          (!selectedClientId ||
            String(l.clientId) === String(selectedClientId)),
      ),
    [allLocations, addedLocations, selectedClientId],
  );

  const handleSave = async () => {
    dispatch(showLoader());
    try {
      const payload = {
        title,
        clientId: selectedClientId,
        locations: addedLocations.map((loc) => ({
          ...loc,
          tasks: loc.tasks.filter((t) => t.description.trim()),
        })),
        guardIds: selectedGuards,
        active,
      };
      const res = isEditing
        ? await updateRoute(id!, payload)
        : await createRoute(payload);
      if (res.success) {
        dispatch(showToast({ message: "Ruta guardada", type: "success" }));
        navigate("/routes");
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al guardar",
            type: "error",
          }),
        );
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const steps = [
    {
      title: "Identificación",
      subtitle: "Nombre y Cliente",
      icon: <FaInfoCircle />,
      isValid: !!title && !!selectedClientId,
    },
    {
      title: "Puntos de Control",
      subtitle: "Secuencia QR",
      icon: <FaMapMarkerAlt />,
      isValid: addedLocations.length > 0,
    },
    {
      title: "Asignación",
      subtitle: "Personal",
      icon: <FaUserFriends />,
      isValid: selectedGuards.length > 0,
    },
    {
      title: "Resumen",
      subtitle: "Verificación",
      icon: <FaClipboardCheck />,
      isValid: true,
    },
  ];

  if (fetchingData)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-[--p] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FaRoute className="text-[--p] opacity-50" size={20} />
          </div>
        </div>
        <p className="mt-6 text-sm text-slate-400 font-light">
          Cargando configuración...
        </p>
      </div>
    );

  return (
    <div className="h-full flex overflow-hidden bg-slate-50" style={{ "--p": primary, "--pl": primaryLight } as React.CSSProperties}>
      {/* SIDEBAR STEPS - Mejorado */}
      <aside className="hidden md:flex w-[260px] bg-white border-r border-slate-200/60 flex-col p-6 shrink-0 shadow-lg relative z-20">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[--p] to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <FaRoute size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800">
                {isEditing ? "Editar Ruta" : "Nueva Ruta"}
              </h1>
              <p className="text-[10px] text-slate-400 font-light">
                {isEditing ? `ID: ${id?.slice(-8)}` : "Asistente de creación"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {steps.map((step, idx) => {
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 text-left ${isActive
                    ? "bg-[--pl] border border-[--p]/20 shadow-sm"
                    : isCompleted
                      ? "hover:bg-slate-50"
                      : "hover:bg-slate-50/50"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${isActive
                      ? "bg-[--p] text-white shadow-lg shadow-emerald-500/25"
                      : isCompleted
                        ? "bg-[--pl] text-[--p]"
                        : "bg-slate-100 text-slate-400"
                    }`}
                >
                  {isCompleted ? <FaCheck size={12} /> : step.icon}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium leading-tight ${isActive ? "text-[--p]" : "text-slate-600"
                      }`}
                  >
                    {step.title}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${isActive ? "text-[--p]/70" : "text-slate-400"
                      }`}
                  >
                    {step.subtitle}
                  </p>
                </div>
                {isActive && (
                  <div className="ml-auto w-1.5 h-8 rounded-full bg-[--p] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-3 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <FaInfoCircle size={12} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-600">
                {steps[currentStep].title}
              </p>
              <p className="text-[9px] text-slate-400">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30">
        {/* Mobile step indicator bar */}
        <div className="md:hidden shrink-0 bg-white border-b border-slate-200/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[--p] text-white flex items-center justify-center text-xs font-bold">
                {currentStep + 1}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700">{steps[currentStep].title}</p>
                <p className="text-[10px] text-slate-400">Paso {currentStep + 1} de {steps.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-1.5 rounded-full transition-all ${idx === currentStep ? "bg-[--p] w-8" : idx < currentStep ? "bg-[--pl]" : "bg-slate-200"
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0">
            {/* STEP 0: IDENTITY - Mejorado */}
            {currentStep === 0 && (
              <div className="h-full overflow-y-auto p-4 md:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800">
                      Información de la Ruta
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                      Define los datos principales de la ruta de vigilancia
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <ITSearchSelect
                          label="Cliente Responsable"
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
                      <div>
                        <ITInput
                          label="Nombre del Recorrido"
                          placeholder="Ej. Ronda Perimetral Nocturna"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          name="title"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Pasos del Asistente
                      </p>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-[--p] text-white flex items-center justify-center text-xs font-bold">
                            1
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-700">Cliente</p>
                            <p className="text-[9px] text-slate-400">Paso actual</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-[--pl] flex items-center justify-center text-[--p] text-xs font-bold">
                            2
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-700">Puntos de Control</p>
                            <p className="text-[9px] text-slate-400">Ubicaciones QR</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-[--pl] flex items-center justify-center text-[--p] text-xs font-bold">
                            3
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-slate-700">Guardias</p>
                            <p className="text-[9px] text-slate-400">Personal asignado</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                            <FaCheck size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Estado Operativo
                            </p>
                            <p className="text-xs text-slate-400">
                              {active ? "Activa" : "Inactiva"}
                            </p>
                          </div>
                        </div>
                        <ITSlideToggle
                          isOn={active}
                          onToggle={(val) => setActive(val)}
                        />
                      </div>
                    )}

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 rounded-2xl flex items-start gap-3 border border-emerald-100/50">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                        <FaInfoCircle size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          Validación de Seguridad
                        </p>
                        <p className="text-xs text-slate-500">
                          Los datos se filtrarán automáticamente por el cliente seleccionado.
                          {!selectedClientId && " Selecciona un cliente para continuar."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: LOCATIONS - Mejorado */}
            {currentStep === 1 && (
              <div className="h-full flex flex-col overflow-hidden bg-slate-50/30">
                {/* Header simplificado y adaptable */}
                <div className="shrink-0 p-4 md:p-6 bg-white border-b border-slate-200/60">
                  <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                            Puntos de Control
                          </h2>
                          <p className="text-sm text-slate-400">
                            {addedLocations.length === 0
                              ? "Agrega ubicaciones para la ruta"
                              : `${addedLocations.length} ubicación${addedLocations.length > 1 ? 'es' : ''} agregada${addedLocations.length > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        {addedLocations.length > 0 && (
                          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                            <FaCheck size={10} />
                            {addedLocations.length} listo{addedLocations.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Fila de selección y acciones - totalmente responsive */}
                      <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2">
                          <ITSearchSelect
                            label="Zona"
                            placeholder="Seleccionar zona..."
                            options={clientZones.map((z) => ({
                              label: z.name,
                              value: z.id,
                            }))}
                            value={selectedZoneId}
                            onChange={setSelectedZoneId}
                            className="text-sm"
                          />
                          <ITSearchSelect
                            label="Punto individual"
                            placeholder="Buscar punto..."
                            options={availableLocations.map((l) => ({
                              label: l.name,
                              value: l.id,
                            }))}
                            value={selectedLocId}
                            onChange={setSelectedLocId as any}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex flex-col lg:flex-row gap-2 lg:w-auto">
                          <ITButton
                            onClick={handleBulkAddByZone}
                            disabled={!selectedZoneId || loadingZones}
                            variant="outlined"
                            className="w-full lg:flex-1 px-3 md:px-4"
                          >
                            <div className="flex items-center justify-center gap-2">
                              {loadingZones ? (
                                <ITLoader size="sm" />
                              ) : (
                                <FaLayerGroup size={14} />
                              )}
                              <span className="text-xs font-medium">Importar zona</span>
                            </div>
                          </ITButton>
                          <ITButton
                            onClick={handleAddLocation}
                            disabled={!selectedLocId}
                            color="primary"
                            className=" md:px-4  shadow-sm shadow-emerald-100"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <FaPlus size={14} />
                              <span className="text-xs font-medium">Agregar</span>
                            </div>
                          </ITButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido principal con scroll */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  <div className="max-w-7xl mx-auto">
                    {addedLocations.length === 0 ? (
                      <div className="h-[60vh] sm:h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                          <FaMapMarkerAlt size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 mb-1">
                          Aún no hay puntos
                        </h3>
                        <p className="text-sm text-slate-400 max-w-sm">
                          Selecciona una zona o un punto individual arriba y presiona <strong>Agregar</strong>.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1.5 rounded-full text-slate-500">
                            <FaLayerGroup size={12} />
                            <span>Importar zona completa</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1.5 rounded-full text-slate-500">
                            <FaPlus size={10} />
                            <span>Agregar punto individual</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Barra de resumen rápida */}
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs text-slate-400">
                            <span className="font-medium text-slate-600">{addedLocations.length}</span> ubicaciones en orden
                          </p>
                          <button
                            onClick={() => setShowClearDialog(true)}
                            className="text-xs text-rose-400 hover:text-rose-600 transition-colors"
                          >
                            Eliminar todos
                          </button>
                        </div>

                        {/* Grid de puntos - responsive 1 columna en móvil, 2 en tablet, 3 en escritorio */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {addedLocations.map((loc, idx) => (
                            <div
                              key={loc.locationId}
                              className="bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                            >
                              {/* Cabecera con número y nombre */}
                              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[--p] text-white text-xs font-bold">
                                      {idx + 1}
                                    </span>
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                      {loc.locationName}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    {/* Botones de orden - visibles siempre en móvil */}
                                    <button
                                      onClick={() => moveLocation(idx, "up")}
                                      disabled={idx === 0}
                                      className="p-1.5 text-slate-300 hover:text-[--p] disabled:opacity-30 transition-colors"
                                      aria-label="Mover arriba"
                                    >
                                      <FaChevronUp size={10} />
                                    </button>
                                    <button
                                      onClick={() => moveLocation(idx, "down")}
                                      disabled={idx === addedLocations.length - 1}
                                      className="p-1.5 text-slate-300 hover:text-[--p] disabled:opacity-30 transition-colors"
                                      aria-label="Mover abajo"
                                    >
                                      <FaChevronDown size={10} />
                                    </button>
                                    <div className="w-px h-6 bg-slate-200 mx-1" />
                                    <button
                                      onClick={() => handleCloneTasks(idx)}
                                      disabled={loc.tasks.length === 0}
                                      className="p-1.5 text-slate-300 hover:text-[--p] disabled:opacity-30 transition-colors"
                                      aria-label="Clonar tareas"
                                      title="Clonar tareas a todos los puntos"
                                    >
                                      <FaCopy size={12} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setAddedLocations(
                                          addedLocations.filter((_, i) => i !== idx)
                                        )
                                      }
                                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                      aria-label="Eliminar punto"
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Lista de tareas */}
                              <div className="p-4 space-y-2">
                                {loc.tasks.map((task, tIdx) => (
                                  <div
                                    key={tIdx}
                                    className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 focus-within:border-[--p]/40 focus-within:bg-white transition-all"
                                  >
                                    <span className="text-[10px] text-slate-400 font-medium w-5 text-center">
                                      {tIdx + 1}
                                    </span>
                                    <input
                                      className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-300 min-h-[32px]"
                                      placeholder="Escribe la tarea..."
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
                                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                      aria-label="Eliminar tarea"
                                    >
                                      <FaPlus size={12} className="rotate-45" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddTask(idx)}
                                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-[--p] hover:text-[--p] hover:bg-[--pl] transition-all flex items-center justify-center gap-2"
                                >
                                  <FaPlus size={12} />
                                  <span>Agregar tarea</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Ayuda rápida */}
                        <div className="mt-6 p-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 p-1.5 rounded-lg">↑↓</span>
                            <span>Reordena con las flechas</span>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-slate-200" />
                          <div className="flex items-center gap-2">
                            <FaCopy className="text-slate-400" />
                            <span>Clona tareas a todos los puntos</span>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-slate-200" />
                          <div className="flex items-center gap-2">
                            <FaTrash className="text-slate-400" />
                            <span>Elimina puntos o tareas</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: GUARDS - Mejorado */}
            {currentStep === 2 && (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="shrink-0 p-4 md:p-6 lg:p-8 bg-white border-b border-slate-200/60">
                  <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                          Personal Operativo
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                          {selectedGuards.length} guardias seleccionados
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full">
                        <div className="relative flex-1 max-w-sm">
                          <FaSearch
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={12}
                          />
                          <input
                            type="text"
                            placeholder="Buscar guardia..."
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[--p] outline-none transition-all"
                            value={guardSearch}
                            onChange={(e) => setGuardSearch(e.target.value)}
                          />
                        </div>
                        <ITButton
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const allIds = filteredGuards.map((g) => g.id);
                            const isAllSelected = allIds.every((id) =>
                              selectedGuards.includes(id),
                            );
                            setSelectedGuards(isAllSelected ? [] : allIds);
                          }}
                          className="px-4 whitespace-nowrap"
                        >
                          <span className="text-[10px]">
                            {filteredGuards.every((g) =>
                              selectedGuards.includes(g.id),
                            )
                              ? "Deseleccionar todos"
                              : "Seleccionar todos"}
                          </span>
                        </ITButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                  <div className="max-w-7xl mx-auto">
                    {filteredGuards.length === 0 ? (
                      <div className="h-[400px] flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                          <FaUsers size={32} />
                        </div>
                        <h3 className="text-base font-medium text-slate-600 mb-1">
                          No hay guardias disponibles
                        </h3>
                        <p className="text-sm text-slate-400">
                          {selectedClientId
                            ? "No hay guardias asignados a este cliente"
                            : "Selecciona un cliente primero"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {filteredGuards.map((guard) => {
                          const isSelected = selectedGuards.includes(guard.id);
                          return (
                            <div
                              key={guard.id}
                              onClick={() => toggleGuard(guard.id)}
                              className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${isSelected
                                  ? "border-[--p] bg-[--pl] shadow-lg shadow-emerald-500/10"
                                  : "border-slate-200/60 bg-white hover:border-slate-300"
                                }`}
                            >
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-medium transition-all shrink-0 ${isSelected
                                    ? "bg-[--p] text-white shadow-lg shadow-emerald-500/25"
                                    : "bg-slate-100 text-slate-500"
                                  }`}
                              >
                                {guard.name[0]}
                                {guard.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">
                                  {guard.name} {guard.lastName}
                                </p>
                                <p className="text-xs text-slate-400">
                                  ID: {guard.id.slice(-6)}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-[--p] text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                  <FaCheck size={10} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SUMMARY - Mejorado */}
            {currentStep === 3 && (
              <div className="h-full overflow-y-auto p-4 md:p-8 lg:p-10">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[--pl] text-[--p] mb-4">
                      <FaClipboardCheck size={28} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800">
                      Revisión Final
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Verifica que toda la configuración sea correcta
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-[--pl] to-transparent">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-[--p] font-medium uppercase tracking-wider">
                            Ruta de Vigilancia
                          </p>
                          <h3 className="text-lg font-semibold text-slate-800 mt-1">
                            {title || "Sin nombre"}
                          </h3>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-xs font-medium ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {active ? 'Activa' : 'Inactiva'}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-slate-100">
                      <div className="bg-white p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-[--pl] text-[--p] flex items-center justify-center mx-auto mb-2">
                          <FaBuilding size={18} />
                        </div>
                        <p className="text-xs text-slate-400">Cliente</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {clients?.find(
                            (c) => String(c.id) === String(selectedClientId),
                          )?.name || "N/A"}
                        </p>
                      </div>
                      <div className="bg-white p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-[--pl] text-[--p] flex items-center justify-center mx-auto mb-2">
                          <FaMapMarkerAlt size={18} />
                        </div>
                        <p className="text-xs text-slate-400">Puntos de Control</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {addedLocations.length} ubicaciones
                        </p>
                      </div>
                      <div className="bg-white p-6 text-center">
                        <div className="w-12 h-12 rounded-xl bg-[--pl] text-[--p] flex items-center justify-center mx-auto mb-2">
                          <FaUsers size={18} />
                        </div>
                        <p className="text-xs text-slate-400">Personal Asignado</p>
                        <p className="text-sm font-medium text-slate-800 mt-1">
                          {selectedGuards.length} guardias
                        </p>
                      </div>
                    </div>

                    {/* Location List */}
                    {addedLocations.length > 0 && (
                      <div className="p-6 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                          Detalle de Puntos
                        </p>
                        <div className="space-y-2">
                          {addedLocations.map((loc, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <span className="text-xs font-bold text-[--p] w-6 text-center">
                                {idx + 1}
                              </span>
                              <span className="text-sm text-slate-700 flex-1">
                                {loc.locationName}
                              </span>
                              <span className="text-xs text-slate-400">
                                {loc.tasks.length} tareas
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 border-t border-emerald-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                          <FaCheck size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-700">
                            Listo para desplegar
                          </p>
                          <p className="text-xs text-emerald-600/70">
                            Todos los datos han sido validados correctamente
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER - Mejorado */}
        <footer className="bg-white border-t border-slate-200/60 p-4 lg:px-8 flex justify-between items-center shadow-sm shrink-0">
          <ITButton
            onClick={() =>
              currentStep === 0
                ? navigate("/routes")
                : setCurrentStep((prev) => prev - 1)
            }
            variant="ghost"
            size="small"
            className="px-5"
          >
            <div className="flex items-center gap-2">
              <FaArrowLeft size={12} />
              <span className="text-xs">
                {currentStep === 0 ? "Salir" : "Atrás"}
              </span>
            </div>
          </ITButton>

          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx <= currentStep
                      ? "bg-[--p]"
                      : "bg-slate-200"
                    }`}
                  style={{ width: idx === currentStep ? '24px' : '16px' }}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 ? (
              <ITButton
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!steps[currentStep].isValid}
                color="primary"
                size="small"
                className="px-6 shadow shadow-emerald-100"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">Continuar</span>
                  <FaChevronRight size={12} />
                </div>
              </ITButton>
            ) : (
              <ITButton
                onClick={handleSave}
                color="primary"
                size="small"
                className="px-6 shadow shadow-emerald-100"
              >
                <div className="flex items-center gap-2">
                  <FaClipboardCheck size={14} />
                  <span className="text-xs">Guardar Ruta</span>
                </div>
              </ITButton>
            )}
          </div>
        </footer>
      </div>

      {/* Create user dialog */}
      <ITDialog
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[--pl] text-[--p] flex items-center justify-center">
                <FaUserFriends size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">
                  Registro Rápido de Guardia
                </h3>
                <p className="text-xs text-slate-400 font-light">
                  Crear nuevo usuario operativo
                </p>
              </div>
            </div>
          </div>
          <CreateUserWizard
            onCancel={() => setShowUserModal(false)}
            onSuccess={() => {
              fetchInitialData();
              setShowUserModal(false);
            }}
          />
        </div>
      </ITDialog>

      {/* CLEAR ALL LOCATIONS DIALOG */}
      <ITDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
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
                <h3 className="text-base font-medium text-slate-800">Eliminar todos los puntos</h3>
                <p className="text-xs text-slate-400 font-light">{addedLocations.length} ubicaciones</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará todos los puntos de control de la ruta. Las tareas configuradas también se perderán.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setShowClearDialog(false)}
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
              onClick={() => {
                setAddedLocations([]);
                setShowClearDialog(false);
              }}
            >
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default CreateRoutePage;