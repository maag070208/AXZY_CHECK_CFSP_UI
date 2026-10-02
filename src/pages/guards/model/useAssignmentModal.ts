/**
 * View-model del modal de asignación de tareas a un guardia.
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { createAssignment } from "@entities/assignment";
import { getLocationsByGuard, type Location } from "@entities/location";

export interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardId: string;
  guardName: string;
  onSuccess: () => void;
}

export const useAssignmentModal = ({ isOpen, guardId, onSuccess }: AssignmentModalProps) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | undefined
  >(undefined);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [tasks, setTasks] = useState<
    { description: string; reqPhoto: boolean }[]
  >([]);
  const [tempTaskDesc, setTempTaskDesc] = useState("");

  const dispatch = useDispatch();
  const currentUser = useSelector((state: AppState) => state.auth);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedLocationId(undefined);
      setNotes("");
      setTasks([]);
      setTempTaskDesc("");
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoadingLocations(true);
    const res = await getLocationsByGuard(guardId);
    if (res.success && res.data) {
      setLocations(res.data);
    }
    setLoadingLocations(false);
  };

  const addTask = () => {
    if (!tempTaskDesc.trim()) return;
    setTasks([...tasks, { description: tempTaskDesc, reqPhoto: false }]);
    setTempTaskDesc("");
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      dispatch(
        showToast({ message: "Selecciona una ubicación", type: "error" }),
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAssignment({
        guardId,
        locationId: String(selectedLocationId),
        assignedBy: currentUser.id ?? "",
        notes: notes || undefined,
        tasks: tasks.length > 0 ? tasks : undefined,
      });

      if (res.success) {
        dispatch(
          showToast({
            message: "Asignación creada correctamente",
            type: "success",
          }),
        );
        onSuccess();
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al crear asignación",
            type: "error",
          }),
        );
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "Error al crear asignación";
      dispatch(
        showToast({
          message: errMsg,
          type: "error",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const locationOptions = locations.map((loc) => {
    const cleanAisle =
      loc.aisle && loc.aisle !== "null" && loc.aisle !== "undefined"
        ? loc.aisle
        : null;
    const cleanNumber =
      loc.number && loc.number !== "null" && loc.number !== "undefined"
        ? loc.number
        : null;

    const details = [
      cleanAisle ? `Pasillo ${cleanAisle}` : null,
      cleanNumber ? `No. ${cleanNumber}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    return {
      label: details ? `${loc.name} (${details})` : loc.name,
      value: loc.id,
    };
  });

  return {
    loadingLocations,
    locationOptions,
    selectedLocationId,
    setSelectedLocationId,
    notes,
    setNotes,
    tasks,
    tempTaskDesc,
    setTempTaskDesc,
    addTask,
    removeTask,
    submitting,
    handleSubmit,
  };
};

export type AssignmentModalViewModel = ReturnType<typeof useAssignmentModal>;
