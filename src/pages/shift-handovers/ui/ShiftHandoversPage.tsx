import {
  Column,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITPage,
  ITText,
  type ITDataTableFetchParams,
  type ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaClipboardCheck, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import { useMemo } from "react";
import { type IShiftHandoverListItem } from "@entities/supervision";
import { formatDateTime, formatShiftDate, fullName } from "@app/core/utils/supervision.utils";
import { TodayComplianceStrip } from "@widgets/today-compliance";
import { ShiftHandoverDetailDialog } from "./ShiftHandoverDetailDialog";
import { useShiftHandoversPage } from "../model/useShiftHandoversPage";

const ShiftHandoversPage = () => {
  const navigate = useNavigate();
  const { canRegister, canManage, isClient } = useSupervisionPermissions();
  const { data: clients, loading: loadingClients } = useCatalog("client");
  const {
    reloadKey,
    detailId,
    setDetailId,
    closeDetail,
    toDelete,
    setToDelete,
    deleting,
    confirmDelete,
    fetchData,
  } = useShiftHandoversPage();

  const columns = useMemo<Column<IShiftHandoverListItem>[]>(
    () => [
      {
        key: "shiftDate",
        label: "Turno",
        type: "date",
        filter: "date-range",
        sortable: true,
        width: 190,
        dateFilterOptions: { maxDate: new Date() },
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800 capitalize">{formatShiftDate(r.shiftDate)}</ITText>
            <ITText className="text-[10px] font-semibold text-slate-400 uppercase">
              {r.schedule.name} · {r.schedule.startTime}-{r.schedule.endTime}
            </ITText>
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
              width: 160,
              catalogOptions: {
                data: clients.map((c) => ({ id: String(c.id), name: c.name })),
                loading: loadingClients,
              },
              render: (r: IShiftHandoverListItem) => (
                <ITText className="text-[11px] font-bold text-slate-700">{r.client.name}</ITText>
              ),
            },
          ]),
      {
        key: "elementsCount",
        label: "Elementos",
        type: "number",
        width: 140,
        render: (r) => (
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[12px] font-black text-slate-800 tabular-nums">{r.elementsCount} recibieron</ITText>
            <ITBadget color={r.lateCount ? "danger" : "success"} size="sm">
              {r.lateCount ? `${r.lateCount} con retardo` : "Puntuales"}
            </ITBadget>
          </ITFlex>
        ),
      },
      {
        key: "checklistOk",
        label: "Equipo",
        type: "number",
        width: 110,
        render: (r) => (
          <ITBadget color={r.checklistOk === r.checklistTotal ? "success" : "warning"} size="sm">
            {r.checklistOk}/{r.checklistTotal} OK
          </ITBadget>
        ),
      },
      {
        key: "search",
        label: "Registró",
        type: "string",
        filter: true,
        width: 180,
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[11px] font-bold text-slate-600">{fullName(r.createdBy)}</ITText>
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
            <ITButton variant="outlined" size="sm" color="secondary" title="Ver detalle" onClick={() => setDetailId(r.id)}>
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
      title="Entregas de turno"
      description="Bitácora de recepción de turnos: quién llegó, a qué hora y en qué estado se recibió el equipo."
      icon={<FaClipboardCheck size={20} />}
      backAction={() => navigate(-1)}
      breadcrumbs={[{ label: "Inicio", onClick: () => navigate("/home") }, { label: "Entregas de turno" }]}
      actions={
        canRegister ? (
          <ITButton variant="filled" color="primary" onClick={() => navigate("/shift-handovers/new")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nueva entrega</ITText>
            </ITFlex>
          </ITButton>
        ) : undefined
      }
    >
      <TodayComplianceStrip type="HANDOVER" reloadKey={reloadKey} />

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
        onRowClick={(row) => setDetailId(String(row.id))}
      />

      <ShiftHandoverDetailDialog handoverId={detailId} onClose={closeDetail} />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        variant="danger"
        title="Eliminar entrega"
        message={
          toDelete
            ? `¿Eliminar la entrega de ${toDelete.client.name} · ${toDelete.schedule.name} del ${formatShiftDate(toDelete.shiftDate)}?`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </ITPage>
  );
};

export default ShiftHandoversPage;
