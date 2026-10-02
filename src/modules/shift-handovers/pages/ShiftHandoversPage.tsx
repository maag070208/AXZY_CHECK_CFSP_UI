import {
  Column,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDataTableFetchParams,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { FaClipboardCheck, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { IShiftHandoverListItem } from "@app/core/types/supervision.types";
import { formatDateTime, formatShiftDate, fullName } from "@app/core/utils/supervision.utils";
import { TodayComplianceStrip } from "@modules/shift-plans/components/TodayComplianceStrip";
import { ShiftHandoverDetailDialog } from "../components/ShiftHandoverDetailDialog";
import { deleteShiftHandover, getPaginatedShiftHandovers } from "../services/ShiftHandoversService";

/** Traduce los filtros por columna de la tabla a los filtros de la API. */
const toApiParams = (params: ITDataTableFetchParams): ITDataTableFetchParams => {
  const f = params.filters ?? {};
  const range = Array.isArray(f.shiftDate) ? (f.shiftDate as [Date | null, Date | null]) : [null, null];
  return {
    ...params,
    filters: {
      ...(f.search ? { search: String(f.search) } : {}),
      ...(f.clientId ? { clientId: String(f.clientId) } : {}),
      ...(range[0] ? { dateFrom: dayjs(range[0]).format("YYYY-MM-DD") } : {}),
      ...(range[1] ? { dateTo: dayjs(range[1]).format("YYYY-MM-DD") } : {}),
    },
  };
};

const ShiftHandoversPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRegister, canManage, isClient } = useSupervisionPermissions();
  const { data: clients, loading: loadingClients } = useCatalog("client");

  const [reloadKey, setReloadKey] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(searchParams.get("detalle"));
  const [toDelete, setToDelete] = useState<IShiftHandoverListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const closeDetail = () => {
    setDetailId(null);
    if (searchParams.has("detalle")) setSearchParams({}, { replace: true });
  };

  const fetchData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await getPaginatedShiftHandovers(toApiParams(params));
    return res as unknown as { data: Record<string, unknown>[]; total: number };
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await deleteShiftHandover(toDelete.id);
      dispatch(
        showToast(
          res.success
            ? { message: "Entrega eliminada", type: "success" }
            : { message: res.messages?.[0] ?? "No se pudo eliminar", type: "error" },
        ),
      );
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] ?? "No se pudo eliminar", type: "error" }));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

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
        fetchData={fetchData}
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
