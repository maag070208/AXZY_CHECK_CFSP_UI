import { ITBadget, ITButton, ITDataTable, ITLoader, ITTripleFilter } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FaCheck, FaEye, FaTrash, FaWrench } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import type { Maintenance } from "@entities/maintenance";
import { MAINTENANCE_STATUS_META } from "@entities/maintenance";
import { ConfirmDialog, DataTableCard, PageShell, SURFACE, TONES } from "@shared/ui";
import { useMaintenancesDeps } from "../model/deps";
import { useMaintenancesPage } from "../model/useMaintenancesPage";
import MaintenanceDetailDialog from "./MaintenanceDetailDialog";

/**
 * Vista de mantenimientos. Sólo pinta: estado y casos de uso vienen de
 * `useMaintenancesPage`.
 */
const MaintenancesPage = () => {
  const vm = useMaintenancesPage(useMaintenancesDeps());

  const columns = useMemo<Column<Maintenance>[]>(
    () => [
      {
        key: "title",
        type: "string",
        label: "Mantenimiento",
        render: (row) => (
          <div className="flex cursor-pointer items-start gap-3" onClick={() => vm.setViewingMaintenance(row)}>
            <div
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: row.categoryRel?.color ? `${row.categoryRel.color}18` : undefined,
                color: row.categoryRel?.color || undefined,
                borderColor: row.categoryRel?.color ? `${row.categoryRel.color}40` : undefined,
              }}
            >
              <FaWrench size={12} className={row.categoryRel?.color ? "" : TONES.warning.text} />
            </div>
            <div className="min-w-0">
              <p className={`line-clamp-1 text-[11px] font-black uppercase tracking-tight hover:text-primary-600 ${SURFACE.strong}`}>
                {row.title}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <ITBadget
                  label={row.categoryRel?.name || row.category || "GENERAL"}
                  color="warning"
                  variant="outlined"
                  size="sm"
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "createdAt",
        type: "date",
        label: "Reportado",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-tight text-secondary-700 dark:text-secondary-200">
              {dayjs(row.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="text-[10px] font-bold uppercase text-secondary-400">
              {dayjs(row.createdAt).format("HH:mm")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "guardId",
        type: "string",
        label: "Reportado por",
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.guard?.name} {row.guard?.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.neutral.dot}`} />
              <span className={SURFACE.microLabel}>@{row.guard?.username || "S/U"}</span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        type: "string",
        label: "Estado",
        render: (row) => {
          const meta = MAINTENANCE_STATUS_META[row.status];
          return (
            <ITBadget color={meta.badge} size="sm">
              {meta.label.toUpperCase()}
            </ITBadget>
          );
        },
      },
      {
        key: "actions",
        type: "actions",
        label: "Control",
        render: (row) => (
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            <ITButton
              onClick={() => vm.setViewingMaintenance(row)}
              variant="outlined"
              color="secondary"
              title="Ver detalle"
              size="sm"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && vm.canResolve && (
              <ITButton
                onClick={() => vm.requestResolve(row)}
                variant="outlined"
                color="success"
                title="Resolver"
                size="sm"
                disabled={vm.resolving && vm.maintenanceToResolve?.id === row.id}
              >
                {vm.resolving && vm.maintenanceToResolve?.id === row.id ? (
                  <ITLoader size="sm" />
                ) : (
                  <FaCheck size={14} />
                )}
              </ITButton>
            )}
            {vm.canDelete && (
              <ITButton
                onClick={() => vm.requestDelete(row)}
                variant="outlined"
                color="error"
                title="Eliminar"
                size="sm"
                disabled={vm.deleting && vm.maintenanceToDelete?.id === row.id}
              >
                <FaTrash size={14} />
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
      title="Gestión de Mantenimientos"
      subtitle="Monitoreo y resolución de desperfectos en instalaciones"
      icon={FaWrench}
      search={{ value: vm.searchTerm, onChange: vm.setSearchTerm, placeholder: "BUSCAR REPORTE..." }}
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onClearFilters={vm.clearFilters}
      showClearFilters={vm.hasFilters}
      extraFilter={
        <ITTripleFilter
          value={vm.statusFilter}
          onChange={vm.setStatusFilter}
          options={[
            { label: "TODOS", value: "ALL" },
            { label: "PENDIENTES", value: "PENDING" },
            { label: "ATENDIDAS", value: "ATTENDED" },
          ]}
        />
      }
    >
      <DataTableCard scrollX>
        <div className="min-w-[650px]">
          <ITDataTable<Maintenance>
            key={vm.refreshKey}
            fetchData={vm.tableFetch}
            columns={columns}
            externalFilters={vm.externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </DataTableCard>

      <MaintenanceDetailDialog
        isOpen={!!vm.viewingMaintenance}
        onClose={() => vm.setViewingMaintenance(null)}
        maintenance={vm.viewingMaintenance}
        onResolve={(id) => {
          const target = vm.viewingMaintenance;
          if (target) vm.requestResolve({ ...target, id });
        }}
        onDelete={vm.requestDelete}
        isAdmin={vm.canDelete}
        isClient={!vm.canResolve}
      />

      <ConfirmDialog
        isOpen={!!vm.maintenanceToResolve}
        onClose={vm.cancelResolve}
        onConfirm={vm.confirmResolve}
        loading={vm.resolving}
        variant="primary"
        title="Resolver Mantenimiento"
        message="El mantenimiento será marcado como atendido. Esta acción no puede deshacerse."
        confirmLabel="Sí, resolver"
      />

      <ConfirmDialog
        isOpen={!!vm.maintenanceToDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar Registro"
        message="Esta acción eliminará el reporte de mantenimiento y todo su historial asociado."
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default MaintenancesPage;
