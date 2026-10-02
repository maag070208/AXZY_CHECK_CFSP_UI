import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITPage,
  ITProgress,
  ITText,
  type Column,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { FaEye, FaPlus, FaTrash, FaTshirt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { formatDateTime, formatShiftDate, fullName } from "@app/core/utils/supervision.utils";
import { TodayComplianceStrip } from "@widgets/today-compliance";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import type { IUniformCheck } from "@entities/supervision";
import { useUniformChecksPage } from "../model/useUniformChecksPage";
import { UniformCheckDetailDialog } from "./UniformCheckDetailDialog";
import { UniformCheckFormDialog } from "./UniformCheckFormDialog";

const COMPLIANT_OPTIONS = [
  { id: "true", name: "Cumple" },
  { id: "false", name: "No cumple" },
];

/** Verificación de uniformes. Sólo pinta. */
const UniformChecksPage = () => {
  const navigate = useNavigate();
  const { canRegister, canManage, isClient } = useSupervisionPermissions();
  const { data: clients, loading: loadingClients } = useCatalog("client");
  const {
    reloadKey,
    refresh,
    formOpen,
    setFormOpen,
    closeForm,
    detail,
    setDetail,
    closeDetail,
    toDelete,
    setToDelete,
    deleting,
    confirmDelete,
    fetchData,
    prefillGuardId,
    prefillShiftDate,
  } = useUniformChecksPage();

  const columns = useMemo<Column<IUniformCheck>[]>(
    () => [
      {
        key: "shiftDate",
        label: "Fecha de turno",
        type: "date",
        filter: "date-range",
        sortable: true,
        width: 150,
        dateFilterOptions: { maxDate: new Date() },
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-bold text-slate-800 capitalize">{formatShiftDate(r.shiftDate)}</ITText>
            <ITText className="text-[10px] font-semibold text-slate-400 uppercase">{r.schedule?.name ?? "Sin horario"}</ITText>
          </ITFlex>
        ),
      },
      {
        key: "guard",
        label: "Guardia",
        type: "string",
        filter: true,
        width: 190,
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800">{fullName(r.guard)}</ITText>
            <ITText className="text-[10px] font-semibold text-slate-400 uppercase">{r.client?.name ?? "Sin cliente"}</ITText>
          </ITFlex>
        ),
      },
      ...(isClient
        ? []
        : [
            {
              key: "clientId",
              label: "Cliente",
              type: "catalog" as const,
              filter: "search" as const,
              width: 150,
              catalogOptions: {
                data: clients.map((c) => ({ id: String(c.id), name: c.name })),
                loading: loadingClients,
              },
              render: (r: IUniformCheck) => (
                <ITText className="text-[11px] font-bold text-slate-600">{r.client?.name ?? "—"}</ITText>
              ),
            },
          ]),
      {
        key: "score",
        label: "Cumplimiento",
        type: "number",
        sortable: true,
        width: 170,
        render: (r) => (
          <ITFlex direction="column" gap={1}>
            <ITFlex align="center" justify="between" gap={2}>
              <ITText className="text-[12px] font-black tabular-nums text-slate-800">{r.score}%</ITText>
              <ITText className="text-[10px] text-slate-400 tabular-nums">
                {r.items.filter((i) => i.ok).length}/{r.items.length}
              </ITText>
            </ITFlex>
            <ITProgress value={r.score} size="sm" color={r.compliant ? "success" : "danger"} />
          </ITFlex>
        ),
      },
      {
        key: "compliant",
        label: "Resultado",
        type: "catalog",
        filter: "catalog",
        width: 120,
        catalogOptions: { data: COMPLIANT_OPTIONS },
        render: (r) => (
          <ITBadget color={r.compliant ? "success" : "danger"} size="sm">
            {r.compliant ? "CUMPLE" : "NO CUMPLE"}
          </ITBadget>
        ),
      },
      {
        key: "evaluatedBy",
        label: "Evaluó",
        type: "string",
        width: 160,
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[11px] font-bold text-slate-600">{fullName(r.evaluatedBy)}</ITText>
            <ITText className="text-[10px] text-slate-400">{formatDateTime(r.createdAt)}</ITText>
          </ITFlex>
        ),
      },
      {
        key: "actions",
        label: "",
        type: "actions",
        width: 100,
        render: (r) => (
          <ITFlex gap={1}>
            <ITButton variant="outlined" size="sm" color="secondary" title="Ver detalle" onClick={() => setDetail(r)}>
              <FaEye size={12} />
            </ITButton>
            {canManage && (
              <ITButton variant="outlined" size="sm" color="error" title="Eliminar" onClick={() => setToDelete(r)}>
                <FaTrash size={11} />
              </ITButton>
            )}
          </ITFlex>
        ),
      },
    ],
    [clients, loadingClients, isClient, canManage],
  );

  return (
    <ITPage
      noPadding
      title="Uniformes"
      description="Revisión de uniforme y aseo de cada elemento al iniciar su turno."
      icon={<FaTshirt size={20} />}
      backAction={() => navigate(-1)}
      breadcrumbs={[{ label: "Inicio", onClick: () => navigate("/home") }, { label: "Uniformes" }]}
      actions={
        canRegister ? (
          <ITButton variant="filled" color="primary" onClick={() => setFormOpen(true)}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nueva revisión</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      <TodayComplianceStrip type="UNIFORM" reloadKey={reloadKey} />

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as unknown as (p: ITDataTableFetchParams) => Promise<ITDataTableResponse<Record<string, unknown>>>}
        reloadTrigger={reloadKey}
        layout="fixed"
        density="compact"
        variant="bordered"
        defaultItemsPerPage={20}
        itemsPerPageOptions={[20, 50, 100]}
        debounceMs={350}
        onRowClick={(row) => setDetail(row as unknown as IUniformCheck)}
      />

      <UniformCheckFormDialog
        isOpen={formOpen}
        onClose={closeForm}
        initialGuardId={prefillGuardId}
        shiftDate={prefillShiftDate}
        onSaved={(check) => {
          closeForm();
          refresh();
          setDetail(check);
        }}
      />

      <UniformCheckDetailDialog check={detail} onClose={closeDetail} />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        variant="danger"
        title="Eliminar revisión"
        message={toDelete ? `¿Eliminar la revisión de ${fullName(toDelete.guard)} del ${formatShiftDate(toDelete.shiftDate)}?` : ""}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </ITPage>
  );
};

export default UniformChecksPage;
