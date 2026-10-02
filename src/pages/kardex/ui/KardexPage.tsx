import { ITBadget, ITButton, ITDataTable, ITTripleFilter } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaBook, FaEye, FaTrash, FaUser } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  formatScanDate,
  formatScanTime,
  SCAN_TYPE_META,
  type KardexEntry,
} from "@entities/kardex";
import { ConfirmDialog, DataTableCard, PageShell, SURFACE, TONES } from "@shared/ui";
import { useKardexDeps } from "../model/deps";
import { useKardexPage } from "../model/useKardexPage";
import KardexDetailDialog from "./KardexDetailDialog";

/** Expediente Kardex. Sólo pinta: el estado vive en `useKardexPage`. */
const KardexPage = () => {
  const vm = useKardexPage(useKardexDeps());

  const columns = useMemo<Column<KardexEntry>[]>(
    () => [
      {
        key: "user",
        type: "string",
        label: "Responsable / Guardia",
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.user?.name} {row.user?.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.neutral.dot}`} />
              <span className={SURFACE.microLabel}>@{row.user?.username || "S/U"}</span>
            </div>
          </div>
        ),
      },
      {
        key: "location",
        type: "string",
        label: "Punto de control",
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {row.location?.name || "Ubicación desconocida"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.success.dot}`} />
              <span className={SURFACE.microLabel}>QR escaneado</span>
            </div>
          </div>
        ),
      },
      {
        key: "timestamp",
        type: "date",
        label: "Cronometría",
        render: (row) => (
          <div className="flex flex-col">
            <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {formatScanTime(row.timestamp)}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${TONES.neutral.dot}`} />
              <span className={SURFACE.microLabel}>{formatScanDate(row.timestamp)}</span>
            </div>
          </div>
        ),
      },
      {
        key: "scanType",
        type: "string",
        label: "Clasificación",
        render: (row) => (
          <ITBadget color={SCAN_TYPE_META[row.scanType]?.badge ?? "primary"} size="sm">
            {SCAN_TYPE_META[row.scanType]?.label ?? row.scanType}
          </ITBadget>
        ),
      },
      {
        key: "multimedia",
        type: "string",
        label: "Evidencia",
        render: (row) => {
          const count = row.media?.length ?? 0;
          return (
            <div className="flex flex-col">
              <span className={`mb-1 text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
                {count} {count === 1 ? "archivo" : "archivos"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${count ? TONES.success.dot : TONES.neutral.dot}`} />
                <span className={SURFACE.microLabel}>{count ? "Con multimedia" : "Sin evidencia"}</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "actions",
        type: "actions",
        label: "Control",
        render: (row) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => vm.setViewingEntry(row)}
              variant="outlined"
              size="sm"
              color="secondary"
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
            <ITButton
              onClick={() => vm.requestDelete(row)}
              variant="outlined"
              size="sm"
              color="error"
              title="Eliminar"
              disabled={vm.deleting && vm.entryToDelete?.id === row.id}
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
      title="Expediente Kardex"
      subtitle="Registro histórico de marcajes, evidencias y reportes de campo"
      icon={FaBook}
      search={{
        value: vm.searchTerm,
        onChange: vm.setSearchTerm,
        placeholder: "BUSCAR RESPONSABLE...",
        icon: FaUser,
      }}
      extraFilter={
        <ITTripleFilter
          value={vm.scanTypeFilter}
          onChange={vm.setScanTypeFilter}
          options={[
            { label: "TODOS", value: "ALL" },
            { label: "ASIGNACIÓN", value: "ASSIGNMENT" },
            { label: "RECURRENTE", value: "RECURRING" },
          ]}
        />
      }
      dateRange={{ value: vm.dateRange, onChange: vm.setDateRange }}
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onClearFilters={vm.clearFilters}
      showClearFilters={vm.hasFilters}
    >
      <DataTableCard>
        <ITDataTable<KardexEntry>
          key={vm.refreshKey}
          columns={columns}
          fetchData={vm.tableFetch}
          externalFilters={vm.externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </DataTableCard>

      <KardexDetailDialog
        isOpen={!!vm.viewingEntry}
        onClose={() => vm.setViewingEntry(null)}
        entry={vm.viewingEntry}
        onDelete={(id) => {
          const target = vm.viewingEntry;
          if (target) vm.requestDelete({ ...target, id });
        }}
      />

      <ConfirmDialog
        isOpen={!!vm.entryToDelete}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
        loading={vm.deleting}
        variant="danger"
        title="Eliminar Marcaje"
        message="Esta acción eliminará el registro del expediente Kardex de forma permanente."
        confirmLabel="Eliminar"
      />
    </PageShell>
  );
};

export default KardexPage;
