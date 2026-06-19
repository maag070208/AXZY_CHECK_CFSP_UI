import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITTimePicker,
  ITSlideToggle,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import { useCallback, useMemo, useState } from "react";
import { FaClock, FaEdit, FaTrash, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  Schedule,
  createSchedule,
  deleteSchedule,
  getPaginatedSchedules,
  getUsersBySchedule,
  updateSchedule,
} from "../SchedulesService";

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewingUsers, setViewingUsers] = useState(false);
  const [selectedScheduleUsers, setSelectedScheduleUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [viewingScheduleName, setViewingScheduleName] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (searchTerm.trim()) f.name = searchTerm.trim();
    if (statusFilter === "ACTIVE") f.active = true;
    if (statusFilter === "INACTIVE") f.active = false;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedSchedules({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setActive(schedule.active);
    } else {
      setEditingSchedule(null);
      setName("");
      setStartTime("07:00");
      setEndTime("15:00");
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    setIsSaving(true);
    dispatch(showLoader());
    try {
      const data = { name, startTime, endTime, active };
      const res: any = editingSchedule
        ? await updateSchedule(editingSchedule.id, data)
        : await createSchedule(data);

      if (res.success) {
        dispatch(
          showToast({
            message: `Horario ${editingSchedule ? "actualizado" : "creado"}`,
            type: "success",
          }),
        );
        closeModal();
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({ message: res.messages?.[0] || "Error", type: "error" }),
        );
      }
    } finally {
      setIsSaving(false);
      dispatch(hideLoader());
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDeleteId) return;
    dispatch(showLoader());
    try {
      const res: any = await deleteSchedule(scheduleToDeleteId);
      if (res.success) {
        dispatch(
          showToast({
            message: "Horario eliminado con éxito",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({ message: res.messages?.[0] || "Error", type: "error" }),
        );
      }
    } finally {
      setScheduleToDeleteId(null);
      dispatch(hideLoader());
    }
  };

  const viewUsers = async (schedule: Schedule) => {
    setViewingScheduleName(schedule.name);
    setViewingUsers(true);
    setLoadingUsers(true);
    try {
      const users = await getUsersBySchedule(schedule.id);
      setSelectedScheduleUsers(users);
    } catch (error) {
      dispatch(
        showToast({ message: "Error al cargar usuarios", type: "error" }),
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "TURNO / HORARIO",
        render: (row: Schedule) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.name}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                ID: #{row.id.toString().substring(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "startTime",
        label: "ENTRADA",
        render: (row: Schedule) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.startTime} HRS
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                INICIO TURNO
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "endTime",
        label: "SALIDA",
        render: (row: Schedule) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.endTime} HRS
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                FIN TURNO
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "users_count",
        label: "PERSONAL",
        render: (row: any) => (
          <div className="flex flex-col">
            <span
              onClick={() => viewUsers(row)}
              className="font-black text-emerald-600 text-[11px] uppercase tracking-tight mb-1 hover:text-emerald-700 cursor-pointer"
            >
              {row._count?.users || 0} Asignados
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                RECURSO HUMANO
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "active",
        label: "ESTADO",
        render: (row: Schedule) => (
          <ITBadget color={row.active ? "success" : "error"} size="small">
            {row.active ? "ACTIVO" : "INACTIVO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: Schedule) => (
          <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
            <ITButton
              onClick={() => openModal(row)}
              variant="outlined"
              size="small"
              title="Editar"
            >
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              onClick={() => setScheduleToDeleteId(row.id)}
              variant="outlined"
              color="error"
              size="small"
              title="Eliminar"
            >
              <FaTrash size={14} />
            </ITButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-4 md:p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Horarios"
        subtitle="Gestión de turnos operativos y controles de asistencia"
        icon={FaClock}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR HORARIO...",
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        onCreate={() => openModal()}
        createLabel="Nuevo Horario"
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "ACTIVOS", value: "ACTIVE" },
              { label: "INACTIVOS", value: "INACTIVE" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-x-auto">
        <div className="min-w-[650px]">
          <ITDataTable
            key={refreshKey}
            fetchData={memoizedFetch as any}
            columns={columns as any}
            externalFilters={externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      <ITDialog
        isOpen={isModalOpen}
        onClose={closeModal}
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
                <h3 className="text-base font-medium text-slate-800">Gestión de Horarios</h3>
                <p className="text-xs text-slate-400 font-light">{editingSchedule ? "Editar turno" : "Nuevo turno"}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-4">
            <ITInput
              label="Nombre del Horario"
              name="name"
              placeholder="EJ. MATUTINO 12X12"
              value={name}
              onChange={(e: any) => setName(e.target.value.toUpperCase())}
              onBlur={() => {}}
            />

            <div className="grid grid-cols-2 gap-4">
              <ITTimePicker
                label="Hora de Entrada"
                name="startTime"
                value={startTime}
                onChange={(e: any) => setStartTime(e.target.value)}
                onBlur={() => {}}
              />
              <ITTimePicker
                label="Hora de Salida"
                name="endTime"
                value={endTime}
                onChange={(e: any) => setEndTime(e.target.value)}
                onBlur={() => {}}
              />
            </div>

            {editingSchedule && (
                <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h5 className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                    Estado del registro
                  </h5>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Activar/desactivar operatividad en el sistema
                  </p>
                </div>
                <ITSlideToggle
                  isOn={active}
                  onToggle={(val) => setActive(val)}
                />
              </div>
            )}
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              type="button"
              variant="ghost"
              onClick={closeModal}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>

            <ITButton
              onClick={handleSave}
              disabled={isSaving || !name || !startTime || !endTime}
              color="primary"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-sky-100"
            >
              {isSaving ? <ITLoader size="sm" /> : "Guardar Turno"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* DELETE SCHEDULE DIALOG */}
      <ITDialog
        isOpen={!!scheduleToDeleteId}
        onClose={() => setScheduleToDeleteId(null)}
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
                <h3 className="text-base font-medium text-slate-800">Eliminar Horario</h3>
                <p className="text-xs text-slate-400 font-light">Registro de turno</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el horario. Los usuarios asignados perderán su turno actual.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setScheduleToDeleteId(null)}
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
              onClick={confirmDelete}
            >
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* USER LIST MODAL */}
      <ITDialog
        isOpen={viewingUsers}
        onClose={() => setViewingUsers(false)}
        className="!w-full !max-w-lg"
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
              <FaUser size={18} />
            </div>
            <div>
              <h3 className="text-xl font-medium text-slate-800 uppercase tracking-tight">
                Personal Asignado
              </h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                {viewingScheduleName}
              </p>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <ITLoader size="lg" />
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-[0.2em]">
                Sincronizando...
              </p>
            </div>
          ) : selectedScheduleUsers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                <FaUser size={18} />
              </div>
              <div>
                <p className="text-slate-900 font-medium text-sm uppercase tracking-tight">
                  Sin personal asignado
                </p>
                <p className="text-slate-400 text-[9px] font-medium uppercase tracking-widest mt-1">
                  No hay usuarios vinculados a este turno
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedScheduleUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-medium border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors uppercase">
                      {user.name?.[0]}
                      {user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900 uppercase tracking-tight">
                        {user.name} {user.lastName}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${user.active ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-slate-300"}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <ITButton
              onClick={() => setViewingUsers(false)}
              variant="ghost"
              className="px-8 font-medium text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cerrar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default SchedulesPage;
