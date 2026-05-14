import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClock, FaEdit, FaKey, FaTrash, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../schedules/SchedulesService";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { CreateUserWizard } from "../components/CreateUserWizard";
import {
  deleteUser,
  getPaginatedUsers,
  updateUser,
  User,
} from "../services/UserService";

const UsersPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useCatalog("role");
  const { data: clients } = useCatalog("client");
  const [schedules, setSchedules] = useState<any[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(
    null,
  );
  const [changingClientUser, setChangingClientUser] = useState<User | null>(
    null,
  );
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (searchTerm.trim()) f.name = searchTerm.trim();
    if (activeFilter === "active") f.active = true;
    if (activeFilter === "inactive") f.active = false;
    return f;
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedUsers({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setChangingPasswordUser(null);
    refreshTable();
  };

  const confirmDelete = async () => {
    if (!userToDeleteId || isDeleting) return;
    dispatch(showLoader());
    setIsDeleting(true);
    try {
      const res = await deleteUser(userToDeleteId.toString());
      if (res.success) {
        dispatch(showToast({ message: "Usuario eliminado", type: "success" }));
        refreshTable();
      } else {
        dispatch(
          showToast({ message: "Error al eliminar usuario", type: "error" }),
        );
      }
    } finally {
      setIsDeleting(false);
      setUserToDeleteId(null);
      dispatch(hideLoader());
    }
  };

  const handleReassignClient = async (clientId: string) => {
    if (!changingClientUser) return;
    dispatch(showLoader());
    try {
      const res = await updateUser(changingClientUser.id, { clientId });
      if (res.success) {
        dispatch(showToast({ message: "Cliente reasignado", type: "success" }));
        handleSuccess();
        setChangingClientUser(null);
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleReassignSchedule = async (scheduleId: string) => {
    if (!changingScheduleUser) return;
    dispatch(showLoader());
    try {
      const res = await updateUser(changingScheduleUser.id, { scheduleId });
      if (res.success) {
        dispatch(
          showToast({ message: "Horario actualizado", type: "success" }),
        );
        handleSuccess();
        setChangingScheduleUser(null);
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "USUARIO / EXPEDIENTE",
        render: (row: User) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.name} {row.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.username}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "roleId",
        label: "ROL / CATEGORÍA",
        render: (row: User) => {
          const roleValue = row.role?.value || "S/R";
          const roleName = row.role?.name || "";

          let color: any = "primary";
          if (roleName === "ADMIN") color = "primary";
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
        render: (row: User) => {
          const roleName = row.role?.name || "";
          const isOp = ["GUARD", "SHIFT", "MAINT"].includes(roleName);
          if (!isOp)
            return (
              <span className="text-[10px] text-slate-300 font-black tracking-widest italic">
                SISTEMA
              </span>
            );

          return (
            <div className="flex flex-col">
              <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                {row.client?.name || "SIN ASIGNAR"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                  {row.schedule
                    ? `${row.schedule.name} (${row.schedule.startTime}-${row.schedule.endTime})`
                    : "SIN HORARIO"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "active",
        label: "ESTADO",
        render: (row: User) => (
          <ITBadget color={row.active ? "success" : "error"} size="small">
            {row.active ? "ACTIVO" : "INACTIVO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: User) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => setChangingScheduleUser(row)}
              variant="outlined"
              color="warning"
              size="small"
              title="Horario"
            >
              <FaClock size={14} />
            </ITButton>
            <ITButton
              onClick={() => setChangingClientUser(row)}
              variant="outlined"
              color="info"
              size="small"
              title="Cliente"
            >
              <FaUserShield size={14} />
            </ITButton>
            <ITButton
              onClick={() => setChangingPasswordUser(row)}
              variant="outlined"
              size="small"
              title="Seguridad"
              color="danger"
            >
              <FaKey size={14} />
            </ITButton>
            <ITButton
              onClick={() => setEditingUser(row)}
              variant="outlined"
              size="small"
              title="Editar"
            >
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              onClick={() => setUserToDeleteId(row.id as any)}
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
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Usuarios"
        subtitle="Gestión de expedientes operativos y controles de acceso"
        icon={FaUserShield}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR USUARIO...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={() => setIsCreateModalOpen(true)}
        createLabel="Nuevo Usuario"
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

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* CREATE/EDIT WIZARD DIALOG */}
      <ITDialog
        isOpen={isCreateModalOpen || !!editingUser}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? "Editar Usuario" : "Registro de Usuario"}
        className="!max-w-2xl !w-full"
      >
        <CreateUserWizard
          userToEdit={editingUser || undefined}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingUser(null);
          }}
          onSuccess={handleSuccess}
        />
      </ITDialog>

      {/* PASSWORD DIALOG */}
      <ITDialog
        isOpen={!!changingPasswordUser}
        onClose={() => setChangingPasswordUser(null)}
        title="Cambiar Contraseña"
        className="!max-w-lg !w-full"
      >
        {changingPasswordUser && (
          <ChangePasswordModal
            user={changingPasswordUser}
            onCancel={() => setChangingPasswordUser(null)}
            onSuccess={handleSuccess}
          />
        )}
      </ITDialog>

      {/* CLIENT REASSIGN DIALOG */}
      <ITDialog
        isOpen={!!changingClientUser}
        onClose={() => setChangingClientUser(null)}
        title="Reasignar Cliente"
        className="!max-w-xl !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="p-10 space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Asignación Corporativa
                </h4>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 border border-slate-100">
                    <FaUserShield size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {changingClientUser?.name} {changingClientUser?.lastName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      ID: {changingClientUser?.id?.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <ITSelect
                  label="Seleccionar Cliente Destino"
                  name="clientId"
                  placeholder="SELECCIONAR CLIENTE..."
                  options={
                    clients.map((c) => ({ label: c.name, value: c.id })) as any
                  }
                  value={changingClientUser?.clientId || ""}
                  onChange={(e: any) => handleReassignClient(e.target.value)}
                />
              </div>
            </section>
          </div>

          <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
            <ITButton
              variant="filled"
              color="secondary"
              onClick={() => setChangingClientUser(null)}
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
        title="Cambiar Turno"
        className="!max-w-xl !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden">
          <div className="p-10 space-y-10">
            <section>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Control de Horario
                </h4>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-amber-500 border border-slate-100">
                    <FaClock size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {changingScheduleUser?.name}{" "}
                      {changingScheduleUser?.lastName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      HORARIO ACTUAL:{" "}
                      {changingScheduleUser?.schedule?.name || "N/A"}
                    </span>
                  </div>
                </div>

                <ITSelect
                  label="Horario Operativo"
                  name="scheduleId"
                  placeholder="SELECCIONAR TURNO..."
                  options={schedules.map((s) => ({
                    label: `${s.name} (${s.startTime} - ${s.endTime})`,
                    value: s.id,
                  }))}
                  value={changingScheduleUser?.scheduleId || ""}
                  onChange={(e: any) => handleReassignSchedule(e.target.value)}
                />
              </div>
            </section>
          </div>

          <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
            <ITButton
              variant="filled"
              color="secondary"
              onClick={() => setChangingScheduleUser(null)}
            >
              Cancelar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!userToDeleteId}
        onClose={() => setUserToDeleteId(null)}
        title="Eliminar Registro"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Inhabilitar Usuario?
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            Esta acción es definitiva y revocaría todos los permisos de acceso
            de forma inmediata.
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setUserToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "ELIMINAR AHORA"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default UsersPage;
