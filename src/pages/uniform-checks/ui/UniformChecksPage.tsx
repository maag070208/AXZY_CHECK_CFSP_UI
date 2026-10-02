import {
  Column,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDataTableFetchParams,
  ITFlex,
  ITPage,
  ITProgress,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEye, FaPlus, FaTrash, FaTshirt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { IUniformCheck } from "@app/core/types/supervision.types";
import { formatDateTime, formatShiftDate, fullName } from "@app/core/utils/supervision.utils";
import { TodayComplianceStrip } from "@modules/shift-plans/components/TodayComplianceStrip";
import { UniformCheckDetailDialog } from "../components/UniformCheckDetailDialog";
import { UniformCheckFormDialog } from "../components/UniformCheckFormDialog";
import { deleteUniformCheck, getPaginatedUniformChecks, getUniformCheck } from "../services/UniformChecksService";

const COMPLIANT_OPTIONS = [
  { id: "true", name: "Cumple" },
  { id: "false", name: "No cumple" },
];

/** Traduce los filtros por columna de la tabla a los filtros de la API. */
const toApiParams = (params: ITDataTableFetchParams): ITDataTableFetchParams => {
  const f = params.filters ?? {};
  const range = Array.isArray(f.shiftDate) ? (f.shiftDate as [Date | null, Date | null]) : [null, null];
  return {
    ...params,
    filters: {
      ...(f.guard ? { search: String(f.guard) } : {}),
      ...(f.clientId ? { clientId: String(f.clientId) } : {}),
      ...(f.compliant ? { compliant: String(f.compliant) } : {}),
      ...(range[0] ? { dateFrom: dayjs(range[0]).format("YYYY-MM-DD") } : {}),
      ...(range[1] ? { dateTo: dayjs(range[1]).format("YYYY-MM-DD") } : {}),
    },
  };
};

const UniformChecksPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canRegister, canManage, isClient } = useSupervisionPermissions();
  const { data: clients, loading: loadingClients } = useCatalog("client");

  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(searchParams.get("nuevo") === "1");
  const [detail, setDetail] = useState<IUniformCheck | null>(null);
  const [toDelete, setToDelete] = useState<IUniformCheck | null>(null);
  const [deleting, setDeleting] = useState(false);

  const prefillGuardId = searchParams.get("guardId") ?? undefined;
  const prefillShiftDate = searchParams.get("shiftDate") ?? undefined;

  // Abre el detalle cuando se llega desde la agenda (?detalle=<id>).
  const detailParam = searchParams.get("detalle");
  useEffect(() => {
    if (!detailParam) return;
    getUniformCheck(detailParam)
      .then((res) => res.success && setDetail(res.data))
      .catch(() => dispatch(showToast({ message: "No se encontró la revisión", type: "error" })));
  }, [detailParam, dispatch]);

  const closeDetail = () => {
    setDetail(null);
    if (searchParams.has("detalle")) setSearchParams({}, { replace: true });
  };

  const closeForm = () => {
    setFormOpen(false);
    if (searchParams.has("nuevo")) setSearchParams({}, { replace: true });
  };

  const fetchData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await getPaginatedUniformChecks(toApiParams(params));
    return res as unknown as { data: Record<string, unknown>[]; total: number };
  }, []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await deleteUniformCheck(toDelete.id);
      dispatch(
        showToast(
          res.success
            ? { message: "Revisión eliminada", type: "success" }
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
        fetchData={fetchData}
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
          setReloadKey((k) => k + 1);
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
