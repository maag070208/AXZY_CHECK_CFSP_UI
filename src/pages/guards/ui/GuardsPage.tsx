import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITSelect,
  ITTripleFilter,
  type Column,
} from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaBell, FaClipboardList, FaClock, FaEye, FaPowerOff, FaUserShield } from "react-icons/fa";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { roleBadge, userInitials, userName, type User } from "@entities/user";
import { ConfirmDialog, DataTableCard, FieldLabel, PageShell, SURFACE, TONES } from "@shared/ui";
import { useGuardsDeps } from "../model/deps";
import { useGuardsPage } from "../model/useGuardsPage";
import { AssignmentModal } from "./AssignmentModal";
import { NotificationSender } from "./NotificationSender";
import { ViewAssignmentsModal } from "./ViewAssignmentsModal";

/** Directorio de guardias. Sólo pinta: el estado vive en `useGuardsPage`. */
const GuardsPage = () => {
  const vm = useGuardsPage(useGuardsDeps());
  const { data: clients } = useCatalog("client");

  const columns = useMemo<Column<User>[]>(
    () => [
      {
        key: "user",
        type: "string",
        label: "Guardia",
        truncate: true,
        width: 240,
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary-100 bg-secondary-50 text-sm font-black uppercase text-secondary-400 dark:border-secondary-700 dark:bg-secondary-800">
              {userInitials(row)}
            </div>
            <div className="min-w-0">
              <span className={`block text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
                {userName(row)}
              </span>
              <span className={`${SURFACE.microLabel} block`}>@{row.username}</span>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        type: "string",
        label: "Rol / Categoría",
        width: 150,
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
        width: 260,
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 block text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.client?.name || "Sin asignar"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
              <span className={`${SURFACE.microLabel} block`}>
                {row.schedule
                  ? `${row.schedule.name} (${row.schedule.startTime}-${row.schedule.endTime})`
                  : "Sin horario"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
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
        key: "activity",
        type: "string",
        label: "Operatividad",
        width: 150,
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 block text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.assignments?.length ?? 0} tareas
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
              <span className={`${SURFACE.microLabel} block`}>Asignaciones activas</span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        type: "actions",
        label: "Control",
        width: 250,
        render: (row) => (
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {!vm.isClient && (
              <>
                <ITButton onClick={() => vm.setScheduleUser(row)} variant="outlined" size="sm" color="warning" title="Horario">
                  <FaClock size={14} />
                </ITButton>
                <ITButton onClick={() => vm.setClientUser(row)} variant="outlined" size="sm" color="info" title="Cliente">
                  <FaUserShield size={14} />
                </ITButton>
                <ITButton
                  onClick={() => vm.requestToggle(row)}
                  variant="outlined"
                  color={row.active ? "error" : "success"}
                  size="sm"
                  title={row.active ? "Desactivar" : "Activar"}
                >
                  <FaPowerOff size={14} />
                </ITButton>
              </>
            )}
            <ITButton onClick={() => vm.openAssignments(row)} variant="outlined" color="secondary" size="sm" title="Ver tareas">
              <FaEye size={14} />
            </ITButton>
            {!vm.isClient && (
              <ITButton onClick={() => vm.openAssignmentForm(row)} variant="outlined" color="secondary" size="sm" title="Asignar">
                <FaClipboardList size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [vm],
  );

  return (
    <PageShell
      title="Directorio de Guardias"
      subtitle="Gestión de personal operativo, asignaciones y controles de turno"
      icon={FaUserShield}
      search={{ value: vm.searchTerm, onChange: vm.setSearchTerm, placeholder: "BUSCAR GUARDIA..." }}
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onClearFilters={vm.clearFilters}
      showClearFilters={vm.hasFilters}
      actions={
        !vm.isClient && (
          <ITButton
            onClick={() => vm.setIsNotificationOpen(true)}
            variant="outlined"
            color="warning"
            size="sm"
            title="Enviar notificación"
          >
            <FaBell size={14} />
          </ITButton>
        )
      }
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
        <div className="min-w-[1180px]">
          <ITDataTable<User>
            key={vm.refreshKey}
            fetchData={vm.tableFetch as never}
            columns={columns}
            externalFilters={vm.externalFilters as never}
            defaultItemsPerPage={10}
            layout="fixed"
            title=""
          />
        </div>
      </DataTableCard>

      <ConfirmDialog
        isOpen={!!vm.guardToToggle}
        onClose={vm.cancelToggle}
        onConfirm={vm.confirmToggle}
        loading={vm.toggling}
        variant={vm.guardToToggle?.active ? "danger" : "primary"}
        title={vm.guardToToggle?.active ? "Desactivar Guardia" : "Activar Guardia"}
        message={
          vm.guardToToggle
            ? `${userName(vm.guardToToggle)} quedará ${vm.guardToToggle.active ? "inactivo y sin acceso" : "activo"} en el sistema.`
            : ""
        }
        confirmLabel={vm.guardToToggle?.active ? "Desactivar" : "Activar"}
      />

      <NotificationSender isOpen={vm.isNotificationOpen} onClose={() => vm.setIsNotificationOpen(false)} />

      {vm.selectedGuard && (
        <AssignmentModal
          isOpen={vm.isAssignmentOpen}
          onClose={() => vm.setIsAssignmentOpen(false)}
          guardId={vm.selectedGuard.id}
          guardName={userName(vm.selectedGuard)}
          onSuccess={vm.handleSuccess}
        />
      )}

      {vm.selectedGuard && (
        <ViewAssignmentsModal
          isOpen={vm.isViewOpen}
          onClose={() => vm.setIsViewOpen(false)}
          guardId={vm.selectedGuard.id}
          guardName={userName(vm.selectedGuard)}
          guard={vm.selectedGuard}
          isClient={vm.isClient}
          onReassignClient={() => vm.setClientUser(vm.selectedGuard)}
          onReassignSchedule={() => vm.setScheduleUser(vm.selectedGuard)}
        />
      )}

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
            placeholder="BUSCAR CLIENTE..."
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
    </PageShell>
  );
};

export default GuardsPage;
