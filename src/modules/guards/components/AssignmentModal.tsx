import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaClipboardList, FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  getLocationsByGuard,
  Location,
} from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: string | number;
  guardName: string;
  onSuccess: () => void;
}

export const AssignmentModal = ({
  isOpen,
  onClose,
  guardId,
  guardName,
  onSuccess,
}: Props) => {
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
    const res = await getLocationsByGuard(String(guardId));
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
        locationId: selectedLocationId,
        assignedBy: currentUser.id || 1,
        notes,
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

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="!max-w-md !w-full"
    >
      <div className="px-8 pt-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
            <FaClipboardList size={18} />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-800">Nueva Asignación</h3>
            <p className="text-xs text-slate-400 font-light">Asignar tarea operativa</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Guard info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center text-[10px] font-medium">
            {guardName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-800">
              {guardName}
            </p>
            <p className="text-[10px] text-slate-400 font-light">
              Asignar ubicación y consignas
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Ubicación
          </label>
          {loadingLocations ? (
            <div className="flex items-center justify-center h-11 bg-slate-50 rounded-xl">
              <ITLoader size="sm" />
            </div>
          ) : (
            <ITSearchSelect
              label=""
              placeholder="Buscar ubicación..."
              options={locationOptions}
              value={selectedLocationId}
              onChange={(val: any) => {
                setSelectedLocationId(val);
              }}
            />
          )}
        </div>

        {/* Tasks */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Consignas
            </label>
            {tasks.length > 0 && (
              <span className="text-[9px] font-medium text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <ITInput
              name="tempTaskDesc"
              placeholder="Escribe una tarea..."
              value={tempTaskDesc}
              onChange={(e) => setTempTaskDesc(e.target.value)}
              onBlur={() => {}}
              className="flex-1"
            />
            <ITButton
              onClick={addTask}
              disabled={!tempTaskDesc.trim()}
              color="primary"
            >
              <FaPlus size={14} />
            </ITButton>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50/80 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-sky-400 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-400 font-light w-4">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-slate-700 font-medium">
                      {task.description}
                    </span>
                  </div>
                  <button
                    onClick={() => removeTask(index)}
                    className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-[9px] text-slate-300 font-light">
                Sin tareas asignadas
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-widest">
            Notas adicionales
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones especiales..."
            className="w-full px-3 py-2.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl resize-none h-20 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
        <ITButton
          variant="ghost"
          onClick={onClose}
          size="small"
          className="px-5 whitespace-nowrap shadow shadow-slate-100"
        >
          Cancelar
        </ITButton>
        <ITButton
          onClick={handleSubmit}
          disabled={!selectedLocationId || submitting}
          color="primary"
          size="small"
          className="px-5 whitespace-nowrap shadow shadow-sky-100"
        >
          {submitting ? <ITLoader size="sm" /> : "Crear Asignación"}
        </ITButton>
      </div>
    </ITDialog>
  );
};
