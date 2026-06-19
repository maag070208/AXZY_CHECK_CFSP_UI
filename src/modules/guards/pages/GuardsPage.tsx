import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITSelect,
  ITText,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaClock,
  FaEye,
  FaPowerOff,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { getSchedules } from "../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  User,
} from "../../users/services/UserService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";

const GuardsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isClient = auth.role === "RESDN";

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReassigningClient, setIsReassigningClient] = useState(false);
  const [isReassigningSchedule, setIsReassigningSchedule] = useState(false);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const externalFilters = useMemo(() => {
    const filters: any = {
      name: searchTerm.trim(),
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

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedUsers({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const confirmToggleStatus = async () => {
    if (!guardToToggle) return;
    setIsUpdating(true);
    const res = await updateUser(guardToToggle.id, {
      active: !guardToToggle.active,
    });
    setIsUpdating(false);
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

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "Guardia",
        render: (row: User) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">
              {row.name?.[0]}
              {row.lastName?.[0]}
            </div>
            <div>
              <ITText className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1 block">
                {row.name} {row.lastName}
              </ITText>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                @{row.username}
              </ITText>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        label: "ROL / CATEGORÍA",
        render: (row: User) => {
          const roleValue = row.role?.value || "S/R";
          const roleName = row.role?.name || "";
          let color: any = "primary";
          if (roleName === "GUARD") color = "success";
          if (roleName === "SHIFT") color = "warning";
          if (roleName === "MAINT") color = "danger";

          return (
            <ITBadget color={color} size="small">
              {roleValue}
            </ITBadget>
          );
        },
      },
      {
        key: "client",
        label: "ASIGNACIÓN",
        render: (row: User) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
              {row.client?.name || "SIN ASIGNAR"}
            </ITText>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
                {row.schedule
                  ? `${row.schedule.name} (${row.schedule.startTime}-${row.schedule.endTime})`
                  : "SIN HORARIO"}
              </ITText>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: User) => (
          <ITBadget color={row.active ? "success" : "error"} size="small">
            {row.active ? "ACTIVO" : "INACTIVO"}
          </ITBadget>
        ),
      },
      {
        key: "activity",
        label: "OPERATIVIDAD",
        render: (row: User) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
              {row.assignments?.length || 0} Tareas
            </ITText>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
                ASIGNACIONES ACTIVAS
              </ITText>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: User) => (
          <div className="flex items-center flex-wrap gap-1.5 md:gap-2">
            {!isClient && (
              <>
                <ITButton
                  onClick={() => setChangingScheduleUser(row)}
                  variant="outlined"
                  size="small"
                  title="Horario"
                  color="warning"
                >
                  <FaClock size={14} />
                </ITButton>
                <ITButton
                  onClick={() => setChangingClientUser(row)}
                  variant="outlined"
                  size="small"
                  title="Cliente"
                >
                  <FaUserShield size={14} />
                </ITButton>
                <ITButton
                  onClick={() => setGuardToToggle(row)}
                  variant="outlined"
                  color={row.active ? "error" : "success"}
                  size="small"
                  title={row.active ? "Desactivar" : "Activar"}
                >
                  <FaPowerOff size={14} />
                </ITButton>
              </>
            )}
            <ITButton
              onClick={() => handleViewAssignments(row)}
              variant="outlined"
              color="secondary"
              size="small"
              title="Ver Tareas"
            >
              <FaEye size={14} />
            </ITButton>
            {!isClient && (
              <ITButton
                onClick={() => handleOpenAssignment(row)}
                variant="outlined"
                color="secondary"
                title="Asignar"
                size="small"
              >
                <FaClipboardList size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [isClient],
  );

  return (
    <div className="p-4 md:p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Guardias"
        subtitle="Gestión de personal operativo, asignaciones y controles de turno"
        icon={FaUserShield}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR GUARDIA...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        extraFilter={
          <ITTripleFilter
            value={activeFilter}
            onChange={setActiveFilter}
            options={[
              { label: "TODOS", value: "all" },
              { label: "ACTIVOS", value: "active" },
              { label: "INACTIVOS", value: "inactive" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-x-auto">
        <div className="min-w-[700px]">
          <ITDataTable<User & Record<string, unknown>>
            key={refreshKey}
            fetchData={memoizedFetch as any}
            columns={columns as any}
            externalFilters={externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </div>

      {/* CLIENT REASSIGN DIALOG */}
      <ITDialog
        isOpen={!!changingClientUser}
        onClose={() => setChangingClientUser(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaUserShield size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Reasignar Cliente</h3>
                <p className="text-xs text-slate-400 font-light">{changingClientUser?.name} {changingClientUser?.lastName}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Seleccionar Cliente Destino</span>
              <ITSelect
                name="clientId"
                placeholder="BUSCAR CLIENTE..."
                options={clients.map((c) => ({ label: c.name, value: c.id })) as any}
                value={changingClientUser?.clientId || ""}
                onChange={(e: any) => {
                  const val = e.target.value;
                  if (!changingClientUser || isReassigningClient) return;
                  setIsReassigningClient(true);
                  updateUser(changingClientUser.id, { clientId: val as string })
                    .finally(() => setIsReassigningClient(false))
                    .then((res) => {
                      if (res.success) {
                        dispatch(showToast({ message: "Cliente reasignado", type: "success" }));
                        refreshTable();
                        setChangingClientUser(null);
                      }
                    });
                }}
                disabled={isReassigningClient}
              />
            </div>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setChangingClientUser(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* SCHEDULE REASSIGN DIALOG */}
      <ITDialog
        isOpen={!!changingScheduleUser}
        onClose={() => setChangingScheduleUser(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <FaClock size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Cambiar Turno</h3>
                <p className="text-xs text-slate-400 font-light">{changingScheduleUser?.name} {changingScheduleUser?.lastName}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Horario Operativo</span>
              <ITSelect
                name="scheduleId"
                placeholder="SELECCIONAR TURNO..."
                options={schedules.map((s) => ({
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                  value: s.id,
                }))}
                value={changingScheduleUser?.scheduleId || ""}
                onChange={(e: any) => {
                  const val = e.target.value;
                  if (!changingScheduleUser || isReassigningSchedule) return;
                  setIsReassigningSchedule(true);
                  updateUser(changingScheduleUser.id, { scheduleId: val as string })
                    .finally(() => setIsReassigningSchedule(false))
                    .then((res) => {
                      if (res.success) {
                        dispatch(showToast({ message: "Horario actualizado", type: "success" }));
                        refreshTable();
                        setChangingScheduleUser(null);
                      }
                    });
                }}
                disabled={isReassigningSchedule}
              />
            </div>
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
          </div>
        </div>
      </ITDialog>

 {/* TOGGLE STATUS DIALOG - Modern Minimalist with Color Accents */}
<ITDialog
  isOpen={!!guardToToggle}
  onClose={() => setGuardToToggle(null)}
  title=""
  className="!max-w-md !w-full"
>
  <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
    {/* Header with subtle color accent */}
    <div className="px-8 pt-8 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        {/* Colored icon circle */}
        <div 
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
            guardToToggle?.active 
              ? "bg-rose-50 text-red-500" 
              : "bg-emerald-50 text-emerald-500"
          }`}
        >
          <FaPowerOff size={18} />
        </div>
        <div>
          <h3 className="text-base font-medium text-slate-800">
            {guardToToggle?.active ? "Desactivar Guardia" : "Activar Guardia"}
          </h3>
          <p className="text-xs text-slate-400 font-light">
            {guardToToggle?.name || "Usuario"}
          </p>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="px-8 py-6">
      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">
          Estado actual:
        </span>
        <span 
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            guardToToggle?.active ? "text-rose-500" : "text-emerald-500"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            guardToToggle?.active ? "bg-rose-500" : "bg-emerald-500"
          }`} />
          {guardToToggle?.active ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
        {guardToToggle?.active
          ? "El guardia perderá acceso a la aplicación. Los turnos activos serán suspendidos."
          : "El guardia recuperará acceso a la aplicación y podrá retomar sus tareas."}
      </p>
    </div>

    {/* Footer */}
    <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
      <ITButton
        variant="ghost"
        size="small"
        onClick={() => setGuardToToggle(null)}
        className="px-5 whitespace-nowrap shadow shadow-slate-100"
      >
        Cancelar
      </ITButton>
      <ITButton
        variant="filled"
        color={guardToToggle?.active ? "danger" : "primary"}
        size="small"
        className={`px-5 whitespace-nowrap shadow transition-all ${
          guardToToggle?.active 
            ? "shadow-rose-100 bg-rose-500 hover:bg-rose-600" 
            : "shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600"
        }`}
        onClick={confirmToggleStatus}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <ITLoader size="sm" color="white" />
        ) : (
          guardToToggle?.active ? "Desactivar" : "Activar"
        )}
      </ITButton>
    </div>
  </div>
</ITDialog>
      {selectedGuard && (
        <>
          <AssignmentModal
            isOpen={isAssignmentModalOpen}
            onClose={() => setIsAssignmentModalOpen(false)}
            guardId={selectedGuard.id}
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
            isClient={isClient}
          />
        </>
      )}
    </div>
  );
};

export default GuardsPage;
