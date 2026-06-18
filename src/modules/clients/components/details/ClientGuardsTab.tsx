import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaClock, FaSync, FaTimes, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  User,
} from "../../../users/services/UserService";
import { TResult } from "@app/core/types/TResult";

interface Props {
  clientId: string | number;
}

export const ClientGuardsTab = ({ clientId }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );
  const [removingUser, setRemovingUser] = useState<User | null>(null);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedUsers({
        ...params,
        filters: {
          ...params.filters,
          clientId,
          role: { name: { in: ["GUARD", "SHIFT", "MAINT"] } },
        },
      });
    },
    [clientId],
  );

  const handleRemoveFromClient = async (user: User) => {
    try {
      const res = await updateUser(user.id, { clientId: null as any });
      if (res.success) {
        dispatch(
          showToast({
            message: "Guardia removido del cliente con éxito",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
        setRemovingUser(null);
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo remover al guardia",
            type: "error",
          }),
        );
      }
    } catch (error) {
      const err = error as TResult<any>;
      dispatch(
        showToast({
          message: err.messages?.[0] || "Error de conexión",
          type: "error",
        }),
      );
    }
  };

  const columns = [
    {
      key: "user",
      label: "PERFIL / USUARIO",
      type: "string",
      render: (row: User) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 text-sm">
            {row.name} {row.lastName}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-slate-400 text-[10px]">
              @{row.username}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "ESTADO OPERATIVO",
      type: "string",
      render: (row: User) => {
        const lastLog = row.assignmentLogs?.[0];
        const status = lastLog
          ? lastLog.type === "ASIGNADO"
            ? "ACTIVO"
            : "BAJA"
          : row.clientId
            ? "ACTIVO"
            : "BAJA";

        return (
          <ITBadget
            color={status === "ACTIVO" ? "success" : "error"}
            size="small"
          >
            {status}
          </ITBadget>
        );
      },
    },
    {
      key: "schedule",
      label: "JORNADA / HORARIO",
      type: "string",
      render: (row: User) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 text-sm">
            {row.schedule?.name || "SIN HORARIO"}
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${row.schedule ? "bg-emerald-400" : "bg-slate-200"}`}
            />
            <span className="text-slate-400 text-[10px]">
              {row.schedule
                ? `${row.schedule.startTime} - ${row.schedule.endTime}`
                : "PENDIENTE ASIGNACIÓN"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "CONTROL",
      type: "actions",
      actions: (row: User) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => setChangingScheduleUser(row)}
            size="small"
            variant="outlined"
            title="Reasignar Horario"
          >
            <FaClock size={14} />
          </ITButton>
          <ITButton
            onClick={() => setRemovingUser(row)}
            size="small"
            variant="outlined"
            color="error"
            title="Remover de Cliente"
          >
            <FaTimes size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-medium text-slate-800">
            Personal Asignado
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Control de guardias y personal operativo en sitio
          </p>
        </div>
        <ITButton
          onClick={() => setRefreshKey((prev) => prev + 1)}
          size="small"
          variant="ghost"
          className="w-9 h-9 p-0 flex items-center justify-center bg-slate-50 rounded-lg hover:bg-slate-100"
        >
          <FaSync className="text-slate-400" size={12} />
        </ITButton>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={5}
        />
      </div>

      <ITDialog
        isOpen={!!changingScheduleUser}
        onClose={() => setChangingScheduleUser(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaClock size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Gestión de Horario</h3>
                <p className="text-xs text-slate-400 font-light">{changingScheduleUser?.name} {changingScheduleUser?.lastName}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-3">
            <span className="text-xs text-slate-400 font-medium">Seleccionar Jornada</span>
            <ITSelect
              name="scheduleId"
              placeholder="Seleccionar horario..."
              options={schedules.map((s) => ({
                label: `${s.name} (${s.startTime} - ${s.endTime})`,
                value: s.id,
              }))}
              value={changingScheduleUser?.scheduleId || ""}
              onChange={async (e: any) => {
                const val = e.target.value;
                if (!changingScheduleUser) return;
                const res = await updateUser(changingScheduleUser.id, {
                  scheduleId: val as string,
                });
                if (res.success) {
                  dispatch(
                    showToast({
                      message: "Horario actualizado con éxito",
                      type: "success",
                    }),
                  );
                  setRefreshKey((prev) => prev + 1);
                  setChangingScheduleUser(null);
                } else {
                  dispatch(
                    showToast({
                      message: res.messages?.[0] || "Error al actualizar",
                      type: "error",
                    }),
                  );
                }
              }}
            />
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setChangingScheduleUser(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={() => setChangingScheduleUser(null)}
              color="primary"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-sky-100"
            >
              Cerrar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
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
                <h3 className="text-base font-medium text-slate-800">Desasignar Guardia</h3>
                <p className="text-xs text-slate-400 font-light">{removingUser?.name || "Guardia"}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              El guardia será removido de este cliente y perderá acceso a sus ubicaciones.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setRemovingUser(null)}
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
              onClick={() => removingUser && handleRemoveFromClient(removingUser)}
            >
              Confirmar Baja
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};
