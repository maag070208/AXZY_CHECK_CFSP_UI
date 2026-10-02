import { ITBadget, ITButton, ITDataTable, ITDialog, ITSelect, ITTripleFilter } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaClock, FaEdit, FaKey, FaTrash, FaUserShield } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import {
  roleBadge,
  roleLabel,
  userInitials,
  userName,
  type User,
} from "@entities/user";
import { ConfirmDialog, DataTableCard, FieldLabel, PageShell, SURFACE, TONES } from "@shared/ui";
import { useUsersDeps } from "../model/deps";
import { useUsersPage } from "../model/useUsersPage";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { CreateUserWizard } from "@features/create-user";

/** Roles que se asignan a un cliente y un turno. */
const OPERATIONAL_ROLES = ["GUARD", "SHIFT", "MAINT"];

/** Directorio de usuarios. Sólo pinta: el estado vive en `useUsersPage`. */
const UsersPage = () => {
  const vm = useUsersPage(useUsersDeps());
  const { data: clients } = useCatalog("client");

  const columns = useMemo<Column<User>[]>(
    () => [
      {
        key: "user",
        type: "string",
        label: "Usuario / Expediente",
        truncate: true,
        width: 300,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary-100 bg-secondary-50 text-sm font-black uppercase text-secondary-400 dark:border-secondary-700 dark:bg-secondary-800">
              {userInitials(row)}
            </div>
            <div className="min-w-0">
              <span className={`mb-1 block text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
                {userName(row)}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${TONES.neutral.dot}`} />
                <span className={SURFACE.microLabel}>@{row.username}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "roleId",
        type: "string",
        label: "Rol / Categoría",
        width: 140,
        render: (row) => (
          <ITBadget color={roleBadge(row.role?.name)} size="sm">
            {(row.role?.value || "S/R").toUpperCase()}
          </ITBadget>
        ),
      },
      {
        key: "client",
        type: "string",
        label: "Asignación",
        truncate: true,
        width: 340,
        render: (row) => {
          if (!OPERATIONAL_ROLES.includes(row.role?.name ?? "")) {
            return (
              <span className="text-[10px] font-black uppercase italic tracking-widest text-secondary-300">
                Sistema
              </span>
            );
          }
          return (
            <div className="flex flex-col">
              <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
                {row.client?.name || "Sin asignar"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
                <span className={SURFACE.microLabel}>
                  {row.schedule
                    ? `${row.schedule.name} (${row.schedule.startTime}-${row.schedule.endTime})`
                    : "Sin horario"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "active",
        type: "boolean",
        label: "Estado",
        width: 110,
        render: (row) => (
          <ITBadget color={row.active ? "success" : "error"} size="sm">
            {row.active ? "ACTIVO" : "INACTIVO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        type: "actions",
        label: "Control",
        width: 230,
        render: (row) => (
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <ITButton onClick={() => vm.setScheduleUser(row)} variant="outlined" color="warning" size="sm" title="Horario">
              <FaClock size={14} />
            </ITButton>
            <ITButton onClick={() => vm.setClientUser(row)} variant="outlined" color="info" size="sm" title="Cliente">
              <FaUserShield size={14} />
            </ITButton>
            <ITButton onClick={() => vm.setPasswordUser(row)} variant="outlined" color="danger" size="sm" title="Seguridad">
              <FaKey size={14} />
            </ITButton>
            <ITButton onClick={() => vm.openEdit(row)} variant="outlined" color="secondary" size="sm" title="Editar">
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              onClick={() => vm.requestDelete(row)}
              variant="outlined"
              color="error"
              size="sm"
              title="Eliminar"
              disabled={vm.deleting && vm.userToDelete?.id === row.id}
            >
              <FaTrash size={14} />
            </ITButton>
          </div>
        ),
      },
    ],
    [vm],
  );

  return (
    <PageShell
      title="Directorio de Usuarios"
      subtitle="Gestión de expedientes operativos y controles de acceso"
      icon={FaUserShield}
      search={{ value: vm.searchTerm, onChange: vm.setSearchTerm, placeholder: "BUSCAR USUARIO..." }}
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onCreate={vm.openCreate}
      createLabel="Nuevo Usuario"
      onClearFilters={vm.clearFilters}
      showClearFilters={vm.hasFilters}
      extraFilter={
        <ITTripleFilter
          value={vm.activeFilter}
          onChange={vm.setActiveFilter}
          options={[
            { label: "TODOS", value: "all" },
            { label: "ACTIVOS", value: "active" },
            { label: "INACTIVOS", value: "inactive" },
          ]}
        />
      }
    >
      <DataTableCard scrollX>
        <div className="min-w-[1120px]">
          <ITDataTable<User>
            key={vm.refreshKey}
            fetchData={vm.tableFetch}
            columns={columns}
            externalFilters={vm.externalFilters}
            defaultItemsPerPage={10}
            layout="fixed"
            title=""
          />
        </div>
      </DataTableCard>

      <ITDialog
        isOpen={vm.isWizardOpen}
        onClose={vm.closeWizard}
        title={vm.editingUser ? "Editar Usuario" : "Registro de Usuario"}
        className="!max-w-2xl w-full!"
      >
        <CreateUserWizard
          userToEdit={vm.editingUser ?? undefined}
          onCancel={vm.closeWizard}
          onSuccess={vm.handleSuccess}
        />
      </ITDialog>

      <ITDialog
        isOpen={!!vm.passwordUser}
        onClose={() => vm.setPasswordUser(null)}
        title="Restablecer contraseña"
        className="!max-w-md w-full!"
      >
        {vm.passwordUser && (
          <ChangePasswordModal
            user={vm.passwordUser}
            onCancel={() => vm.setPasswordUser(null)}
            onSuccess={vm.handleSuccess}
          />
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!vm.clientUser}
        onClose={() => vm.setClientUser(null)}
        title="Reasignar cliente"
        className="!max-w-md w-full!"
      >
        <div className="space-y-3">
          <FieldLabel>Seleccionar cliente destino</FieldLabel>
          <ITSelect
            name="clientId"
            placeholder="SELECCIONAR CLIENTE..."
            options={clients.map((c) => ({ label: c.name, value: String(c.id) }))}
            value={vm.clientUser?.clientId ?? ""}
            onChange={(e) => void vm.reassignClient(e.target.value)}
          />
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!vm.scheduleUser}
        onClose={() => vm.setScheduleUser(null)}
        title="Cambiar turno"
        className="!max-w-md w-full!"
      >
        <div className="space-y-3">
          <FieldLabel>Horario operativo</FieldLabel>
          <ITSelect
            name="scheduleId"
            placeholder="SELECCIONAR TURNO..."
            options={vm.schedules.map((s) => ({
              label: `${s.name} (${s.startTime} - ${s.endTime})`,
              value: s.id,
            }))}
            value={vm.scheduleUser?.scheduleId ?? ""}
            onChange={(e) => void vm.reassignSchedule(e.target.value)}
          />
        </div>
      </ITDialog>

      <ConfirmDialog
        isOpen={!!vm.userToDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar usuario"
        message={
          vm.userToDelete
            ? `${userName(vm.userToDelete)} (${roleLabel(vm.userToDelete.role?.name)}). Esta acción es definitiva y revocaría todos sus permisos de acceso de forma inmediata.`
            : ""
        }
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default UsersPage;
