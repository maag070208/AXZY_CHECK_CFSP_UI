/**
 * View-model de la pestaña de programación de turnos.
 *
 * La vista queda como puro render: antes llamaba a `getShiftPlans`,
 * `updateShiftPlan` y `deleteShiftPlan` directamente, con `try/catch` porque
 * el cliente axios legacy lanza. Ahora la entidad devuelve `TResult`.
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  deleteShiftPlan,
  getShiftPlans,
  updateShiftPlan,
  type IShiftPlan,
} from "@entities/supervision";

export interface UseShiftPlansTabOptions {
  /** Se avisa al contenedor para que la agenda se recargue. */
  onChanged: () => void;
}

export const useShiftPlansTab = ({ onChanged }: UseShiftPlansTabOptions) => {
  const dispatch = useDispatch();

  const [plans, setPlans] = useState<IShiftPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IShiftPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<IShiftPlan | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notify = useCallback(
    (message: string, type: "success" | "error") => dispatch(showToast({ message, type })),
    [dispatch],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getShiftPlans();
    setLoading(false);

    if (res.success && Array.isArray(res.data)) setPlans(res.data);
    else if (!res.success) notify(res.messages?.[0] ?? "No se pudo cargar la programación", "error");
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const changed = useCallback(() => {
    void load();
    onChanged();
  }, [load, onChanged]);

  const toggleActive = useCallback(
    async (plan: IShiftPlan, active: boolean) => {
      setBusyId(plan.id);
      const res = await updateShiftPlan(plan.id, { active });
      setBusyId(null);

      if (res.success) changed();
      else notify(res.messages?.[0] ?? "No se pudo actualizar", "error");
    },
    [changed, notify],
  );

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    const target = toDelete;
    setBusyId(target.id);

    const res = await deleteShiftPlan(target.id);

    setBusyId(null);
    setToDelete(null);

    if (res.success) {
      notify("Programación eliminada", "success");
      changed();
    } else {
      notify(res.messages?.[0] ?? "No se pudo eliminar", "error");
    }
  }, [toDelete, notify, changed]);

  return {
    plans,
    loading,
    editing,
    formOpen,
    setFormOpen,
    setEditing,
    toDelete,
    setToDelete,
    busyId,
    toggleActive,
    confirmDelete,
    changed,
  };
};

export type ShiftPlansTabViewModel = ReturnType<typeof useShiftPlansTab>;
