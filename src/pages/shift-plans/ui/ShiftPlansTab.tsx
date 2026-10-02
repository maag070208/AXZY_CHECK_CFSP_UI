import {
  Column,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITEmptyState,
  ITLoader,
  ITSlideToggle,
  ITTable,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaCalendarPlus, FaEdit, FaExclamationTriangle, FaTrash } from "react-icons/fa";
import type { IShiftPlan } from "@entities/supervision";
import { useShiftPlansTab } from "../model/useShiftPlansTab";
import { WEEKDAY_SHORT } from "@app/core/utils/supervision.utils";
import { ShiftPlanFormDialog } from "./ShiftPlanFormDialog";

interface ShiftPlansTabProps {
  canManage: boolean;
  /** Notifica cambios para que la agenda se recalcule. */
  onChanged: () => void;
}

const describeDays = (days: number[]): string => {
  if (days.length === 7) return "Todos los días";
  if (days.join() === "1,2,3,4,5") return "Lunes a viernes";
  return days.map((d) => WEEKDAY_SHORT[d]).join(" · ");
};

/** Configuración: qué turnos de qué cliente exigen entrega y/o uniforme. */
export const ShiftPlansTab = ({ canManage, onChanged }: ShiftPlansTabProps) => {
  const {
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
  } = useShiftPlansTab({ onChanged });


  const columns: Column<IShiftPlan>[] = [
    {
      key: "client",
      label: "Cliente / turno",
      type: "string",
      render: (plan) => (
        <div className={plan.active ? "" : "opacity-60"}>
          <ITText className="text-sm font-black text-slate-800">{plan.client.name}</ITText>
          <ITText className="text-xs text-slate-500">
            {plan.schedule.name} · {plan.schedule.startTime} - {plan.schedule.endTime}
          </ITText>
        </div>
      ),
    },
    {
      key: "require",
      label: "Exige",
      type: "string",
      render: (plan) => (
        <div className="flex flex-wrap gap-1.5">
          {plan.requireHandover && <ITBadget color="info" size="sm">Entrega</ITBadget>}
          {plan.requireUniform && <ITBadget color="purple" size="sm">Uniforme</ITBadget>}
        </div>
      ),
    },
    {
      key: "toleranceMinutes",
      label: "Tolerancia",
      type: "number",
      render: (plan) => <ITText className="text-sm font-bold text-slate-700 tabular-nums">{plan.toleranceMinutes} min</ITText>,
    },
    {
      key: "daysOfWeek",
      label: "Días",
      type: "string",
      render: (plan) => <ITText className="text-xs font-semibold text-slate-600">{describeDays(plan.daysOfWeek)}</ITText>,
    },
    {
      key: "guardsCount",
      label: "Guardias",
      type: "number",
      render: (plan) =>
        plan.requireUniform && plan.guardsCount === 0 ? (
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"
            title="Asigna este horario a los guardias del cliente para generar sus revisiones"
          >
            <FaExclamationTriangle size={11} /> Sin guardias
          </span>
        ) : (
          <ITText className="text-sm font-bold text-slate-700 tabular-nums">{plan.guardsCount}</ITText>
        ),
    },
    {
      key: "active",
      label: "Activo",
      type: "boolean",
      render: (plan) =>
        busyId === plan.id ? (
          <ITLoader size="sm" />
        ) : (
          <ITSlideToggle isOn={plan.active} disabled={!canManage} onToggle={(v) => toggleActive(plan, v)} />
        ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      render: (plan) =>
        canManage ? (
          <div className="flex gap-1.5 justify-end">
            <ITButton
              variant="outlined"
              size="sm"
              color="secondary"
              title="Editar"
              onClick={() => {
                setEditing(plan);
                setFormOpen(true);
              }}
            >
              <FaEdit size={11} />
            </ITButton>
            <ITButton variant="outlined" size="sm" color="error" title="Eliminar" onClick={() => setToDelete(plan)}>
              <FaTrash size={11} />
            </ITButton>
          </div>
        ) : null,
    },
  ];


  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <ITLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <ITText className="text-sm text-slate-500">
          Define qué turnos de cada cliente deben registrar entrega y revisión de uniforme. La agenda se genera sola a partir de aquí.
        </ITText>
        {canManage && (
          <ITButton color="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <FaCalendarPlus size={12} /> Programar turno
            </span>
          </ITButton>
        )}
      </div>

      {plans.length === 0 ? (
        <ITEmptyState
          icon={<FaCalendarPlus />}
          title="Sin turnos programados"
          description="Programa los turnos de tus clientes para generar la agenda de entregas y revisiones."
          action={canManage ? <ITButton color="primary" label="Programar el primero" onClick={() => { setEditing(null); setFormOpen(true); }} /> : undefined}
        />
      ) : (
        <ITTable
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          data={plans as unknown as Record<string, unknown>[]}
          variant="bordered"
          density="compact"
          defaultItemsPerPage={10}
          itemsPerPageOptions={[10, 25, 50]}
        />
      )}

      <ShiftPlanFormDialog
        isOpen={formOpen}
        plan={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          changed();
        }}
      />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={busyId === toDelete?.id}
        variant="danger"
        title="Eliminar programación"
        message={toDelete ? `¿Dejar de programar ${toDelete.schedule.name} en ${toDelete.client.name}? Los registros ya hechos se conservan.` : ""}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  );
};
