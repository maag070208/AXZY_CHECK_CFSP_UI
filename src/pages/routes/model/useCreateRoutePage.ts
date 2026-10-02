/**
 * View-model del alta/edición de ruta.
 *
 * Es el archivo más grande del proyecto: wizard de cuatro pasos con selección
 * de puntos de control, guardias y tareas por punto.
 *
 * Se extraen la lógica y el estado. `steps` y `pageProps` se quedan en la
 * vista: contienen iconos JSX.
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useITTheme } from "@axzydev/axzy_ui_system";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import { listUsers, type User } from "@entities/user";
import { getZonesByClient } from "@entities/zone";
import { listLocations, type Location } from "@entities/location";

/** Fila de punto de control que maneja el wizard. */
export type RouteLocationRow = {
  locationId: string;
  locationName?: string;
  tasks?: { description: string; reqPhoto: boolean }[];
};
import {
  createRoute,
  getRouteById,
  updateRoute,
} from "@entities/route";





export const useCreateRoutePage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { colors } = useITTheme();
  const primary = colors.primary || "#10b981";
  const primaryLight = primary + "15";

  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [addedLocations, setAddedLocations] = useState<RouteLocationRow[]>([]);
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
      const zonesRes = await getZonesByClient(clientId);
      setClientZones(zonesRes.success && Array.isArray(zonesRes.data) ? zonesRes.data : []);
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
    const [locRes, usersRes] = await Promise.all([listLocations(), listUsers()]);
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
    copy[locIdx].tasks![taskIdx].description = val;
    setAddedLocations(copy);
  };

  const handleAddTask = (idx: number) => {
    const copy = [...addedLocations];
    copy[idx].tasks = [...(copy[idx].tasks ?? []), { description: "", reqPhoto: false }];
    setAddedLocations(copy);
  };

  const handleCloneTasks = (idx: number) => {
    const sourceTasks = [...(addedLocations[idx].tasks ?? [])];
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
        clientId: String(selectedClientId),
        locations: addedLocations.map((loc) => ({
          ...loc,
          tasks: (loc.tasks ?? []).filter((t: { description: string }) => t.description.trim()),
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

  return {
    isEditing,
    clients,
    primary,
    primaryLight,
    active,
    addedLocations,
    allGuards,
    allLocations,
    availableLocations,
    clientZones,
    currentStep,
    fetchFullData,
    fetchInitialData,
    fetchZones,
    fetchingData,
    filteredGuards,
    guardSearch,
    handleAddLocation,
    handleAddTask,
    handleBulkAddByZone,
    handleCloneTasks,
    handleSave,
    handleTaskChange,
    loadingZones,
    moveLocation,
    selectedClientId,
    selectedGuards,
    selectedLocId,
    selectedZoneId,
    setActive,
    setAddedLocations,
    setAllGuards,
    setAllLocations,
    setClientZones,
    setCurrentStep,
    setFetchingData,
    setGuardSearch,
    setLoadingZones,
    setSelectedClientId,
    setSelectedGuards,
    setSelectedLocId,
    setSelectedZoneId,
    setShowClearDialog,
    setShowUserModal,
    setTitle,
    showClearDialog,
    showUserModal,
    title,
    toggleGuard,
  };
};

export type CreateRoutePageViewModel = ReturnType<typeof useCreateRoutePage>;
