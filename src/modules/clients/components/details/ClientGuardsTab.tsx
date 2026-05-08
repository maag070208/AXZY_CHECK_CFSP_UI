import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaClock, FaSync, FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  User,
} from "../../../users/services/UserService";

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
            message: "Guardia removido del cliente",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
        setRemovingUser(null);
      } else {
        dispatch(
          showToast({
            message: "Error al remover guardia",
            type: "error",
          }),
        );
      }
    } catch (error) {
      dispatch(showToast({ message: "Error inesperado", type: "error" }));
    }
  };

  const columns = [
    {
      key: "user",
      label: "Guardia",
      type: "string",
      render: (row: User) => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 text-sm">
            {row.name.charAt(0)}
            {row.lastName?.charAt(0) || ""}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm uppercase">
              {row.name} {row.lastName}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              @{row.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      type: "string",
      render: (row: User) => {
        const lastLog = row.assignmentLogs?.[0];
        // Determinar status: si el último log es ASIGNADO, está ACTIVO.
        // Si no hay logs, usamos clientId como indicativo de ACTIVO.
        const status = lastLog 
            ? (lastLog.type === "ASIGNADO" ? "ACTIVO" : "BAJA") 
            : (row.clientId ? "ACTIVO" : "BAJA");

        return (
          <div
            className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${status === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {status}
          </div>
        );
      },
    },
    {
      key: "schedule",
      label: "Turno / Horario",
      type: "string",
      render: (row: User) =>
        row.schedule ? (
          <div className="text-sm text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase">
              {row.schedule.name}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <FaClock className="text-[10px]" /> {row.schedule.startTime} -{" "}
              {row.schedule.endTime}
            </div>
          </div>
        ) : (
          <span className="text-[11px] italic text-slate-300">Sin Horario</span>
        ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: User) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => setChangingScheduleUser(row)}
            size="small"
            variant="ghost"
            className="text-amber-500 hover:bg-amber-50 !p-2"
            title="Cambiar Horario"
          >
            <FaClock />
          </ITButton>
          <ITButton
            onClick={() => setRemovingUser(row)}
            size="small"
            variant="ghost"
            className="text-red-300 hover:bg-red-50 !p-2"
            title="Remover de Cliente"
          >
            <FaTimes />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Personal Operativo Asignado
        </h3>
        <ITButton
          onClick={() => setRefreshKey((prev) => prev + 1)}
          size="small"
          variant="outlined"
          className="h-9 w-9 p-0 flex justify-center items-center"
        >
          <FaSync className="text-slate-400" />
        </ITButton>
      </div>

      <ITDataTable
        key={refreshKey}
        columns={columns as any}
        fetchData={memoizedFetch as any}
        defaultItemsPerPage={5}
      />

      <ITDialog
        isOpen={!!changingScheduleUser}
        onClose={() => setChangingScheduleUser(null)}
        title={`Reasignar Horario`}
        className="!max-w-md"
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
              <FaClock size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Cambiar Horario
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                {changingScheduleUser?.name} {changingScheduleUser?.lastName}
              </p>
            </div>
          </div>

          <div className="w-full">
            <ITSelect
              label=""
              name=""
              placeholder="Seleccionar horario..."
              options={schedules.map((s) => ({
                label: `${s.name} (${s.startTime} - ${s.endTime})`,
                value: s.id,
              }))}
              value={changingScheduleUser?.scheduleId || ""}
              onChange={(e: any) => {
                const val = e.target.value;
                if (!changingScheduleUser) return;
                updateUser(changingScheduleUser.id, {
                  scheduleId: val as string,
                }).then((res) => {
                  if (res.success) {
                    dispatch(
                      showToast({
                        message: "Horario actualizado",
                        type: "success",
                      }),
                    );
                    setRefreshKey((prev) => prev + 1);
                    setChangingScheduleUser(null);
                  }
                });
              }}
            />
          </div>

          <div className="flex justify-center">
            <ITButton
              variant="outlined"
              onClick={() => setChangingScheduleUser(null)}
              className="!rounded-2xl !px-10 border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50"
            >
              Cancelar
            </ITButton>
          </div>
        </div>
      </ITDialog>
      <ITDialog
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
        title={`Confirmar Remoción`}
        className="!max-w-md"
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
              <FaTimes size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Remover Guardia
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                ¿Seguro que deseas remover a {removingUser?.name} {removingUser?.lastName}?
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <ITButton
              variant="outlined"
              onClick={() => setRemovingUser(null)}
              className="!rounded-2xl !px-10 border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="primary"
              onClick={() => removingUser && handleRemoveFromClient(removingUser)}
              className="!rounded-2xl !px-10 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest border-none"
            >
              Sí, Remover
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};
