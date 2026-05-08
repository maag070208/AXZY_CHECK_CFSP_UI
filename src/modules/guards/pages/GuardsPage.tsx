import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaClock,
  FaEye,
  FaSearch,
  FaSync,
  FaUserShield,
  FaPowerOff,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  User,
} from "../../users/services/UserService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { ITTripleFilter } from "@app/core/components/ITTripleFilter";

const GuardsPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedGuard, setSelectedGuard] = useState<User | null>(null);
  const [guardToToggle, setGuardToToggle] = useState<User | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [changingClientUser, setChangingClientUser] = useState<User | null>(
    null,
  );
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );

  const { data: clients } = useCatalog("client");
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilter]);

  const externalFilters = useMemo(() => {
    const filters: any = {
      name: searchTerm,
      role: {
        name: {
          in: ["GUARD", "SHIFT", "MAINT"],
        },
      },
    };

    if (activeFilter === "active") filters.active = true;
    if (activeFilter === "inactive") filters.active = false;

    return filters;
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedUsers(params);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleToggleStatus = (guard: User) => {
    setGuardToToggle(guard);
  };

  const confirmToggleStatus = async () => {
    if (!guardToToggle) return;
    const res = await updateUser(guardToToggle.id, {
      active: !guardToToggle.active,
    });
    if (res.success) {
      dispatch(
        showToast({
          message: `Guardia ${!guardToToggle.active ? "activado" : "desactivado"}`,
          type: "success",
        }),
      );
      refreshTable();
    } else {
      dispatch(
        showToast({ message: "Error al actualizar estado", type: "error" }),
      );
    }
    setGuardToToggle(null);
  };

  const handleOpenAssignment = (guard: User) => {
    setSelectedGuard(guard);
    setIsAssignmentModalOpen(true);
  };

  const handleViewAssignments = (guard: User) => {
    setSelectedGuard(guard);
    setIsViewModalOpen(true);
  };

  const handleSuccess = () => {
    setIsAssignmentModalOpen(false);
    refreshTable();
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Directorio de Guardias"
        subtitle="Gestión de personal operativo, asignaciones y controles de turno"
        icon={FaUserShield}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group w-full sm:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Buscar guardia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 h-[42px] px-11 bg-white border border-slate-100 rounded-xl outline-none text-sm focus:border-emerald-500 transition-all shadow-sm font-medium text-slate-600"
              />
            </div>

            <ITTripleFilter
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { label: "Todos", value: "all" },
                { label: "Activos", value: "active" },
                { label: "Inactivos", value: "inactive" },
              ]}
            />

            <ITButton
              onClick={refreshTable}
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
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters as any}
          defaultItemsPerPage={10}
          columns={[
            {
              key: "user",
              label: "GUARDIA",
              type: "string",
              render: (row: any) => (
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
              key: "role",
              label: "CATEGORÍA",
              type: "string",
              render: (row: any) => {
                const roleValue =
                  typeof row.role === "object" ? row.role.value : row.role;
                return (
                  <div className="flex items-center">
                    <span className="px-2 py-1 bg-[#F1F5F9] text-[#475569] font-bold text-[10px] rounded border border-slate-100 uppercase tracking-wider">
                      {roleValue}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "client",
              label: "CLIENTE ASIGNADO",
              type: "string",
              render: (row: any) => (
                <div className="text-xs font-bold text-[#065911] uppercase tracking-tight">
                  {row.client?.name || (
                    <span className="text-slate-300 italic font-normal">
                      Sin asignar
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: "schedule",
              label: "TURNO",
              type: "string",
              render: (row: any) =>
                row.schedule ? (
                  <div className="text-sm text-slate-600">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs uppercase">
                      {row.schedule.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <FaClock className="text-[10px]" />{" "}
                      {row.schedule.startTime} - {row.schedule.endTime}
                    </div>
                  </div>
                ) : (
                  <span className="text-[11px] italic text-slate-300">
                    Sin Horario
                  </span>
                ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: any) => (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${row.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-300"}`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${row.active ? "text-emerald-600" : "text-red-400"}`}
                  >
                    {row.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ),
            },
            {
              key: "activity",
              label: "RESUMEN OPERATIVO",
              type: "string",
              render: (row: any) => (
                <div className="flex flex-col py-1">
                  <div className="font-bold text-slate-700 text-[10px] uppercase tracking-tight">
                    Tareas Asignadas: {row.assignments?.length || 0}
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">
                    Control de Tareas Diarias
                  </div>
                </div>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: any) => (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 mr-2">
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
                      onClick={() => setChangingClientUser(row)}
                      size="small"
                      variant="ghost"
                      className="text-indigo-500 hover:bg-indigo-50 !p-2"
                      title="Cambiar Cliente"
                    >
                      <FaUserShield />
                    </ITButton>
                  </div>
                  <ITButton
                    onClick={() => handleToggleStatus(row)}
                    size="small"
                    color={row.active ? "danger" : "primary"}
                    variant="outlined"
                    title={
                      row.active ? "Desactivar Guardia" : "Activar Guardia"
                    }
                  >
                    <FaPowerOff />
                  </ITButton>
                  <ITButton
                    onClick={() => handleViewAssignments(row)}
                    size="small"
                    variant="outlined"
                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 !rounded-lg"
                    title="Ver Tareas"
                  >
                    <FaEye />
                  </ITButton>
                  <ITButton
                    onClick={() => handleOpenAssignment(row)}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    title="Asignar Tarea"
                  >
                    <FaClipboardList />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ITDialog
        isOpen={!!changingClientUser}
        onClose={() => setChangingClientUser(null)}
        title={`Reasignar Cliente`}
        className="!max-w-md"
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <FaUserShield size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Cambiar Cliente
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                {changingClientUser?.name} {changingClientUser?.lastName}
              </p>
            </div>
          </div>

          <div className="w-full">
            <ITSelect
              label=""
              name=""
              placeholder="Seleccionar cliente..."
              options={
                clients.map((c) => ({ label: c.name, value: c.id })) as any
              }
              value={changingClientUser?.clientId || ""}
              onChange={(e: any) => {
                const val = e.target.value;
                if (!changingClientUser) return;
                updateUser(changingClientUser.id, {
                  clientId: val as string,
                }).then((res) => {
                  if (res.success) {
                    dispatch(
                      showToast({
                        message: "Cliente actualizado",
                        type: "success",
                      }),
                    );
                    refreshTable();
                    setChangingClientUser(null);
                  }
                });
              }}
            />
          </div>

          <div className="flex justify-center">
            <ITButton
              variant="outlined"
              onClick={() => setChangingClientUser(null)}
              className="!rounded-2xl !px-10 border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50"
            >
              Cancelar
            </ITButton>
          </div>
        </div>
      </ITDialog>

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
                    refreshTable();
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

      {selectedGuard && (
        <>
          <AssignmentModal
            isOpen={isAssignmentModalOpen}
            onClose={() => setIsAssignmentModalOpen(false)}
            guardId={selectedGuard.id as any}
            guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
            onSuccess={handleSuccess}
          />
          <ViewAssignmentsModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            guardId={selectedGuard.id}
            guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
            guard={selectedGuard}
            onReassignClient={() => setChangingClientUser(selectedGuard)}
            onReassignSchedule={() => setChangingScheduleUser(selectedGuard)}
          />
        </>
      )}

      <ITDialog
        isOpen={!!guardToToggle}
        onClose={() => setGuardToToggle(null)}
        title="Confirmar Cambio de Estado"
      >
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-8">
            ¿Estás seguro de que deseas{" "}
            <span className="font-bold">
              {guardToToggle?.active ? "desactivar" : "activar"}
            </span>{" "}
            al guardia{" "}
            <span className="font-bold text-slate-800">
              {guardToToggle?.name} {guardToToggle?.lastName}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <ITButton variant="outlined" onClick={() => setGuardToToggle(null)}>
              Cancelar
            </ITButton>
            <ITButton
              className={
                guardToToggle?.active
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-0"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              }
              onClick={confirmToggleStatus}
            >
              Confirmar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default GuardsPage;
