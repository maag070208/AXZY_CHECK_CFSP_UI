import { ITBadget, ITButton, ITDataTable, ITLoader, ITTripleFilter } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useMemo } from "react";
import { FaCheck, FaExclamationTriangle, FaEye, FaTrash } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import type { Incident } from "@entities/incident";
import { INCIDENT_STATUS_META } from "@entities/incident";
import { ConfirmDialog, DataTableCard, PageShell, SURFACE, TONES } from "@shared/ui";
import { useIncidentsDeps } from "../model/deps";
import { useIncidentsPage } from "../model/useIncidentsPage";
import IncidentDetailDialog from "./IncidentDetailDialog";

/**
 * Vista de incidencias. Sólo pinta: todo el estado y los casos de uso vienen de
 * `useIncidentsPage`.
 */
const IncidentsPage = () => {
  const vm = useIncidentsPage(useIncidentsDeps());

  const columns = useMemo<Column<Incident>[]>(
    () => [
      {
        key: "title",
        type: "string",
        label: "Incidencia",
        render: (row) => (
          <div className="flex cursor-pointer items-start gap-3" onClick={() => vm.setViewingIncident(row)}>
            <div
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: row.category?.color ? `${row.category.color}18` : undefined,
                color: row.category?.color || undefined,
                borderColor: row.category?.color ? `${row.category.color}40` : undefined,
              }}
            >
              <FaExclamationTriangle size={12} className={row.category?.color ? "" : TONES.danger.text} />
            </div>
            <div className="min-w-0">
              <p className={`line-clamp-1 text-[11px] font-black uppercase tracking-tight hover:text-primary-600 ${SURFACE.strong}`}>
                {row.title}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <ITBadget label={row.category?.name || "GENERAL"} color="primary" variant="outlined" size="sm" />
                <span className={SURFACE.microLabel}>• {row.client?.name}</span>
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
            <span className="text-[10px] font-black uppercase text-secondary-700 dark:text-secondary-200">
              {dayjs(row.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="text-[9px] font-bold uppercase text-secondary-400">
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
          const meta = INCIDENT_STATUS_META[row.status];
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
            <ITButton onClick={() => vm.setViewingIncident(row)} variant="outlined" size="sm" color="secondary" title="Ver detalle">
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && vm.canResolve && (
              <ITButton
                onClick={() => vm.requestResolve(row)}
                variant="outlined"
                size="sm"
                color="success"
                title="Resolver"
                disabled={vm.resolving && vm.incidentToResolve?.id === row.id}
              >
                {vm.resolving && vm.incidentToResolve?.id === row.id ? <ITLoader size="sm" /> : <FaCheck size={14} />}
              </ITButton>
            )}
            {vm.canDelete && (
              <ITButton
                onClick={() => vm.requestDelete(row)}
                color="error"
                variant="outlined"
                size="sm"
                title="Eliminar"
                disabled={vm.deleting && vm.incidentToDelete?.id === row.id}
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
      title="Gestión de Incidencias"
      subtitle="Monitoreo y respuesta inmediata a reportes de seguridad"
      icon={FaExclamationTriangle}
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
        <div className="min-w-[700px]">
          <ITDataTable<Incident>
            key={vm.refreshKey}
            fetchData={vm.tableFetch}
            columns={columns}
            externalFilters={vm.externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </DataTableCard>

      <IncidentDetailDialog
        isOpen={!!vm.viewingIncident}
        onClose={() => vm.setViewingIncident(null)}
        incident={vm.viewingIncident}
        onResolve={(id) => {
          const target = vm.viewingIncident;
          if (target) vm.requestResolve({ ...target, id });
        }}
        onDelete={vm.requestDelete}
        isAdmin={vm.canDelete}
        isClient={!vm.canResolve}
      />

      <ConfirmDialog
        isOpen={!!vm.incidentToResolve}
        onClose={vm.cancelResolve}
        onConfirm={vm.confirmResolve}
        loading={vm.resolving}
        variant="primary"
        title="Resolver Incidencia"
        message="La incidencia será marcada como atendida. Esta acción no puede deshacerse."
        confirmLabel="Confirmar"
      />

      <ConfirmDialog
        isOpen={!!vm.incidentToDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar Incidencia"
        message="Esta acción eliminará el reporte de incidencia y todo su historial asociado."
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default IncidentsPage;
