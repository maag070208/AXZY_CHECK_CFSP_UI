import { ITBadget, ITButton, ITDataTable, ITLoader, ITTripleFilter } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaBell, FaCheck, FaEye, FaMapMarkerAlt } from "react-icons/fa";
import type { Column } from "@axzydev/axzy_ui_system";
import {
  formatAlertDate,
  formatAlertTime,
  guardName,
  hasCoordinates,
  mapsUrl,
  PANIC_STATUS_META,
  type PanicAlert,
} from "@entities/panic-alert";
import { FormDialog, SURFACE, TONES, DataTableCard, PageShell } from "@shared/ui";
import { usePanicAlertsDeps } from "../model/deps";
import { usePanicAlertsPage } from "../model/usePanicAlertsPage";
import { PanicAlertDetailDialog } from "./PanicAlertDetailDialog";
import { ITInput } from "@axzydev/axzy_ui_system";

/** Vista de alertas de pánico. Sólo pinta: el estado vive en `usePanicAlertsPage`. */
const PanicAlertsPage = () => {
  const vm = usePanicAlertsPage(usePanicAlertsDeps());

  const columns = useMemo<Column<PanicAlert>[]>(
    () => [
      {
        key: "title",
        type: "string",
        label: "Alerta",
        render: (row) => {
          const live = vm.isLive(row);
          return (
            <div className="flex cursor-pointer items-start gap-3" onClick={() => vm.setViewing(row)}>
              <div
                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  live
                    ? "border-danger-300 bg-danger-100 text-danger-700"
                    : `${TONES.danger.soft} ${TONES.danger.border} ${TONES.danger.text}`
                }`}
              >
                <FaBell size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`line-clamp-1 text-[11px] font-black uppercase tracking-tight hover:text-danger-600 ${SURFACE.strong}`}>
                    {row.message ?? "Alerta de pánico"}
                  </p>
                  {live && (
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${TONES.danger.soft} ${TONES.danger.text}`}>
                      LIVE
                    </span>
                  )}
                </div>
                <p className={`${SURFACE.microLabel} mt-0.5 line-clamp-1`}>
                  {row.source} · {row.resolutionComment ?? "sin comentario"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "createdAt",
        type: "date",
        label: "Cuándo",
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-secondary-700 dark:text-secondary-200">
              {formatAlertDate(row.createdAt)}
            </span>
            <span className="text-[9px] font-bold uppercase text-secondary-400">
              {formatAlertTime(row.createdAt)} HRS
            </span>
          </div>
        ),
      },
      {
        key: "guard",
        type: "string",
        label: "Guardia",
        render: (row) => (
          <div className="flex flex-col">
            <span className={`text-[11px] font-black uppercase tracking-tight ${SURFACE.strong}`}>
              {guardName(row)}
            </span>
            <span className={SURFACE.microLabel}>{row.client?.name ?? "—"}</span>
          </div>
        ),
      },
      {
        key: "location",
        type: "string",
        label: "Ubicación",
        render: (row) =>
          hasCoordinates(row) ? (
            <a
              href={mapsUrl(row)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-black uppercase ring-1 transition-colors ${TONES.danger.soft} ${TONES.danger.text} ${TONES.danger.border} hover:bg-danger-600 hover:text-white`}
            >
              <FaMapMarkerAlt size={10} />
              Ver mapa
            </a>
          ) : (
            <span className="text-[9px] font-bold uppercase text-secondary-400">Sin coordenadas</span>
          ),
      },
      {
        key: "status",
        type: "string",
        label: "Estado",
        render: (row) => {
          const meta = PANIC_STATUS_META[row.status];
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
              onClick={() => vm.setViewing(row)}
              variant="outlined"
              size="sm"
              color="secondary"
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && vm.canResolve && (
              <ITButton
                onClick={() => vm.requestResolve(row)}
                variant="outlined"
                size="sm"
                color="success"
                title="Marcar como atendida"
                disabled={vm.resolving && vm.toResolve?.id === row.id}
              >
                {vm.resolving && vm.toResolve?.id === row.id ? <ITLoader size="sm" /> : <FaCheck size={14} />}
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
      title="Alertas de Pánico"
      subtitle="Emergencias reportadas por guardias en campo"
      icon={FaBell}
      search={{
        value: vm.searchTerm,
        onChange: vm.setSearchTerm,
        placeholder: "BUSCAR ALERTA, GUARDIA O CLIENTE...",
      }}
      onRefresh={vm.refresh}
      refreshKey={vm.refreshKey}
      onClearFilters={vm.clearFilters}
      showClearFilters={vm.hasFilters}
      extraFilter={
        <ITTripleFilter
          value={vm.statusFilter}
          onChange={vm.setStatusFilter}
          options={[
            { label: "TODAS", value: "ALL" },
            { label: "PENDIENTES", value: "PENDING" },
            { label: "ATENDIDAS", value: "RESOLVED" },
            { label: "EN PROGRESO", value: "IN_PROGRESS" },
            { label: "DESCARTADAS", value: "DISMISSED" },
          ]}
        />
      }
    >
      <DataTableCard scrollX>
        <div className="min-w-[800px]">
          <ITDataTable<PanicAlert>
            key={vm.refreshKey}
            fetchData={vm.tableFetch}
            columns={columns}
            externalFilters={vm.externalFilters}
            defaultItemsPerPage={10}
            title=""
          />
        </div>
      </DataTableCard>

      <PanicAlertDetailDialog
        isOpen={!!vm.viewing}
        onClose={() => vm.setViewing(null)}
        alert={vm.viewing}
        onResolve={vm.requestResolve}
      />

      <FormDialog
        isOpen={!!vm.toResolve}
        onClose={vm.cancelResolve}
        title="Marcar alerta como atendida"
        size="md"
        submitLabel="Confirmar"
        onSubmit={vm.confirmResolve}
        submitting={vm.resolving}
      >
        <p className="text-sm leading-relaxed text-secondary-600 dark:text-secondary-300">
          Vas a marcar la alerta de pánico de{" "}
          <span className="font-bold">{vm.toResolve ? guardName(vm.toResolve) : "el guardia"}</span> como
          atendida. Esta acción no se puede deshacer.
        </p>
        <ITInput
          name="resolutionComment"
          label="Comentario de cierre (opcional)"
          placeholder="Describe brevemente cómo se atendió la emergencia..."
          value={vm.resolutionComment}
          onChange={(e) => vm.setResolutionComment(e?.target?.value ?? "")}
          type="textarea"
          disabled={vm.resolving}
          className="w-full"
        />
      </FormDialog>
    </PageShell>
  );
};

export default PanicAlertsPage;
