import {
  ITButton,
  ITDialog,
  ITInput,
  ITTimePicker,
  ITDataTable,
} from "@axzydev/axzy_ui_system";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaClock,
  FaSync,
  FaSearch,
  FaUser,
} from "react-icons/fa";
import {
  Schedule,
  createSchedule,
  deleteSchedule,
  updateSchedule,
  getPaginatedSchedules,
  getUsersBySchedule,
} from "../SchedulesService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ModuleHeader } from "@app/core/components/ModuleHeader";

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingUsers, setViewingUsers] = useState(false);
  const [selectedScheduleUsers, setSelectedScheduleUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [viewingScheduleName, setViewingScheduleName] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return { name: searchTerm };
  }, [searchTerm]);

  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedSchedules(params);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
    } else {
      setEditingSchedule(null);
      setName("");
      setStartTime("07:00");
      setEndTime("15:00");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, { name, startTime, endTime });
        dispatch(
          showToast({
            message: "Horario actualizado correctamente",
            type: "success",
          }),
        );
      } else {
        await createSchedule({ name, startTime, endTime });
        dispatch(
          showToast({
            message: "Horario creado correctamente",
            type: "success",
          }),
        );
      }
      refreshTable();
      closeModal();
    } catch (error: any) {
      const msg =
        error.response?.data?.messages?.[0] || "Error al guardar el horario";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  const handleDelete = (id: number) => {
    setScheduleToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!scheduleToDeleteId) return;
    try {
      await deleteSchedule(scheduleToDeleteId);
      setScheduleToDeleteId(null);
      refreshTable();
      dispatch(
        showToast({
          message: "Horario eliminado correctamente",
          type: "success",
        }),
      );
    } catch (error: any) {
      const msg =
        error.response?.data?.messages?.[0] || "Error al eliminar el horario";
      dispatch(showToast({ message: msg, type: "error" }));
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

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Directorio de Horarios"
        subtitle="Gestión de turnos operativos y controles de asistencia"
        icon={FaClock}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group w-full sm:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar horario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 h-[42px] px-11 bg-white border border-slate-100 rounded-xl outline-none text-sm focus:border-emerald-500 transition-all shadow-sm font-medium text-slate-600"
              />
            </div>

            <ITButton
              onClick={() => setRefreshKey((prev) => prev + 1)}
              color="secondary"
              variant="outlined"
              className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
              size="small"
            >
              <FaSync
                className={`text-xs text-slate-500 ${refreshKey % 2 === 0 ? "" : "rotate-180"}`}
              />
              <span className="text-xs font-bold text-slate-500">
                Actualizar
              </span>
            </ITButton>

            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 h-[42px] rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all w-full sm:w-auto"
            >
              <FaPlus className="text-xs" />
              <span>Nuevo Horario</span>
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          columns={[
            {
              key: "name",
              label: "NOMBRE DEL TURNO",
              type: "string",
              render: (row: any) => (
                <div className="flex flex-col py-2">
                  <span className="font-bold text-slate-800 text-sm uppercase">
                    {row.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Turno Operativo
                  </span>
                </div>
              ),
            },
            {
              key: "startTime",
              label: "ENTRADA",
              type: "string",
              render: (row: any) => (
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <FaClock size={12} className="text-emerald-400" />
                  {row.startTime}
                </div>
              ),
            },
            {
              key: "endTime",
              label: "SALIDA",
              type: "string",
              render: (row: any) => (
                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                  <FaClock size={12} className="text-slate-300" />
                  {row.endTime}
                </div>
              ),
            },
            {
              key: "users_count",
              label: "PERSONAL ASIGNADO",
              type: "string",
              render: (row: any) => (
                <div
                  className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-emerald-600 transition-colors py-2"
                  onClick={() => viewUsers(row)}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-bold border border-slate-100 text-xs uppercase">
                    <FaUser size={12} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight">
                    {row._count?.users || 0} Usuarios
                  </span>
                </div>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: any) => (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${row.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"}`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${row.active ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {row.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <div className="flex gap-1">
                  <ITButton
                    onClick={() => openModal(row)}
                    size="small"
                    variant="ghost"
                    className="!text-slate-400 hover:!text-emerald-600 hover:!bg-emerald-50 !p-2"
                  >
                    <FaEdit />
                  </ITButton>
                  <ITButton
                    onClick={() => handleDelete(row.id)}
                    size="small"
                    variant="ghost"
                    className="!text-slate-400 hover:!text-rose-600 hover:!bg-rose-50 !p-2"
                  >
                    <FaTrash />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ITDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchedule ? "Editar Horario" : "Nuevo Horario"}
        className="!w-full !max-w-md"
      >
        <div className="p-4 space-y-8">
          <ITInput
            label="Nombre del Horario"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {}}
            placeholder="Ej. Matutino"
            className="!bg-slate-50 !border-none !h-12 !rounded-2xl"
          />
          <div className="grid grid-cols-2 gap-6">
            <ITTimePicker
              label="Entrada"
              name="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              onBlur={() => {}}
              className="!bg-slate-50 !border-none !h-12 !rounded-2xl"
            />
            <ITTimePicker
              label="Salida"
              name="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              onBlur={() => {}}
              className="!bg-slate-50 !border-none !h-12 !rounded-2xl"
            />
          </div>

          <div className="flex justify-end gap-4 mt-10">
            <ITButton variant="outlined" color="secondary" onClick={closeModal}>
              Cancelar
            </ITButton>
            <ITButton
              variant="outlined"
              onClick={handleSave}
              color="primary"
              disabled={!name || !startTime || !endTime}
            >
              Guardar Horario
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Delete Confirmation Modal */}
      <ITDialog
        isOpen={!!scheduleToDeleteId}
        onClose={() => setScheduleToDeleteId(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-4">
          <p className="text-slate-600 mb-6">
            ¿Estás seguro de eliminar este horario? Esta acción no se puede
            deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setScheduleToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              className="!bg-red-600 text-white"
              onClick={confirmDelete}
            >
              Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>
      {/* User List Modal */}
      <ITDialog
        isOpen={viewingUsers}
        onClose={() => setViewingUsers(false)}
        title={`Personal Asignado: ${viewingScheduleName}`}
        className="!w-full !max-w-lg"
      >
        <div className="p-4">
          {loadingUsers ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                Cargando personal...
              </p>
            </div>
          ) : selectedScheduleUsers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100">
                <FaUser size={24} />
              </div>
              <div>
                <p className="text-slate-900 font-black text-sm uppercase tracking-tight">
                  Sin personal asignado
                </p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Este horario no tiene usuarios vinculados
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
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors uppercase">
                      {user.name.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                        {user.name} {user.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full ${user.active ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-slate-300"}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <ITButton
              onClick={() => setViewingUsers(false)}
              className="!bg-slate-900 !text-white !rounded-2xl !px-10 !h-12 shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all font-black uppercase text-[11px] tracking-widest"
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
