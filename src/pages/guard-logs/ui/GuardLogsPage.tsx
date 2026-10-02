import { ITBadget, ITButton, ITDataTable, ITLoader, ITSearchSelect, ITTripleFilter } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaClipboardList, FaClock, FaTrash, FaUserClock } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  formatLogDate,
  formatLogDuration,
  formatLogTime,
  type GuardLoginLog,
} from "@entities/guard-log";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { ConfirmDialog, DataTableCard, PageShell, SURFACE, TONES } from "@shared/ui";
import { useGuardLogsDeps } from "../model/deps";
import { useGuardLogsPage } from "../model/useGuardLogsPage";

/** Vista de prenómina. Sólo pinta: el estado vive en `useGuardLogsPage`. */
const GuardLogsPage = () => {
  const vm = useGuardLogsPage(useGuardLogsDeps());
  const { data: clients } = useCatalog("client");

  const columns = useMemo<Column<GuardLoginLog>[]>(
    () => [
      {
        key: "user",
        type: "string",
        label: "Guardia",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary-100 bg-secondary-50 text-sm font-black uppercase text-secondary-400 dark:border-secondary-700 dark:bg-secondary-800">
              {row.user.name?.[0]}
              {row.user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <span className={`block line-clamp-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
                {row.user.name} {row.user.lastName}
              </span>
              <span className={`${SURFACE.microLabel} block`}>@{row.user.username}</span>
            </div>
          </div>
        ),
      },
      {
        key: "loginAt",
        type: "date",
        label: "Entrada",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-secondary-700 dark:text-secondary-200">
              {formatLogDate(row.loginAt)}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${TONES.success.text}`}>
              {formatLogTime(row.loginAt)} HRS
            </span>
          </div>
        ),
      },
      {
        key: "logoutAt",
        type: "date",
        label: "Salida",
        render: (row) => (
          <div className="flex flex-col">
            {row.logoutAt ? (
              <>
                <span className="text-[10px] font-black uppercase text-secondary-700 dark:text-secondary-200">
                  {formatLogDate(row.logoutAt)}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${TONES.danger.text}`}>
                  {formatLogTime(row.logoutAt)} HRS
                </span>
              </>
            ) : (
              <ITBadget color="warning" size="sm">
                ABIERTO
              </ITBadget>
            )}
          </div>
        ),
      },
      {
        key: "duration",
        type: "string",
        label: "Duración",
        render: (row) => {
          const duration = formatLogDuration(row);
          if (!duration) {
            return (
              <span className={`animate-pulse text-[10px] font-black uppercase tracking-widest ${TONES.success.text}`}>
                En curso
              </span>
            );
          }
          return (
            <span className={`font-mono text-[11px] font-black ${SURFACE.strong}`}>{duration} HRS</span>
          );
        },
      },
      {
        key: "actions",
        type: "actions",
        label: "",
        width: 136,
        render: (row) => (
          <div className="flex items-center gap-1">
            {!row.logoutAt && (
              <ITButton
                onClick={() => vm.requestClose(row)}
                color="success"
                variant="outlined"
                size="sm"
                title="Cerrar turno"
                disabled={(vm.closing && vm.logToClose?.id === row.id) || (vm.deleting && vm.logToDelete?.id === row.id)}
              >
                {vm.closing && vm.logToClose?.id === row.id ? <ITLoader size="sm" /> : <FaClock size={14} />}
              </ITButton>
            )}
            <ITButton
              onClick={() => vm.requestDelete(row)}
              color="error"
              variant="outlined"
              size="sm"
              title="Eliminar"
              disabled={(vm.deleting && vm.logToDelete?.id === row.id) || (vm.closing && vm.logToClose?.id === row.id)}
            >
              {vm.deleting && vm.logToDelete?.id === row.id ? <ITLoader size="sm" /> : <FaTrash size={14} />}
            </ITButton>
          </div>
        ),
      },
    ],
    [vm],
  );

  return (
    <PageShell
      title="Prenómina — Control de Asistencia"
      subtitle="Registro de entrada y salida de guardias operativos"
      icon={FaClipboardList}
      filter={
        vm.canFilterByClient ? (
          <ITSearchSelect
            placeholder="FILTRAR POR CLIENTE..."
            options={(clients || []).map((c) => ({ label: c.name, value: String(c.id) }))}
            value={vm.clientId}
            clearable
            onClear={() => vm.setClientId("")}
            onChange={(val) => vm.setClientId(String(val))}
            className="w-full"
          />
        ) : undefined
      }
      search={{
        value: vm.searchTerm,
        onChange: vm.setSearchTerm,
        placeholder: "BUSCAR GUARDIA...",
        icon: FaUserClock,
      }}
      dateRange={{ value: vm.dateRange, onChange: vm.setDateRange }}
      extraFilter={
        <ITTripleFilter
          value={vm.statusFilter}
          onChange={vm.setStatusFilter}
          options={[
            { label: "TODOS", value: "ALL" },
            { label: "ABIERTOS", value: "OPEN" },
            { label: "CERRADOS", value: "CLOSED" },
          ]}
        />
      }
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onClearFilters={vm.clearFilters}
      showClearFilters={vm.hasFilters}
    >
      <DataTableCard>
        <ITDataTable<GuardLoginLog>
          key={vm.refreshKey}
          columns={columns}
          fetchData={vm.tableFetch}
          defaultItemsPerPage={10}
          title=""
        />
      </DataTableCard>

      <ConfirmDialog
        isOpen={!!vm.logToClose}
        onClose={vm.cancelClose}
        onConfirm={vm.confirmCloseShift}
        loading={vm.closing}
        variant="primary"
        title="Cerrar Turno"
        message={`Se registrará la salida de ${vm.logToClose?.user?.name ?? "el guardia"}. El turno quedará cerrado y no podrá modificarse.`}
        confirmLabel="Cerrar turno"
      />

      <ConfirmDialog
        isOpen={!!vm.logToDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar Registro"
        message="Esta acción eliminará el registro de prenómina de forma permanente. No podrá recuperarse."
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default GuardLogsPage;
