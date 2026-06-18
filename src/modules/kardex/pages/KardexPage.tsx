import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { translateScanType } from "@app/core/utils/status.utils";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { FaBook, FaEye, FaTrash, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import KardexDetailDialog from "../components/KardexDetailDialog";
import { deleteKardexEntry, getPaginatedKardex, KardexEntry } from "../services/KardexService";

const KardexPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanTypeFilter, setScanTypeFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").toDate(),
    dayjs().tz("America/Tijuana").toDate(),
  ]);
  const [viewingEntry, setViewingEntry] = useState<KardexEntry | null>(null);
  const [entryToDeleteId, setEntryToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!entryToDeleteId || isDeleting) return;
    setIsDeleting(true);
    const res = await deleteKardexEntry(entryToDeleteId);
    setIsDeleting(false);
    setEntryToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Marcaje eliminado", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: "Error al eliminar marcaje", type: "error" }));
    }
  };

  const externalFilters = useMemo(() => {
    const filters: any = {};
    if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
      filters.date = [
        dayjs(selectedDate[0]).tz("America/Tijuana").startOf("day").format(),
        dayjs(selectedDate[1]).tz("America/Tijuana").endOf("day").format(),
      ];
    }
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    if (scanTypeFilter !== "ALL") {
      filters.scanType = scanTypeFilter;
    }
    return filters;
  }, [selectedDate, searchTerm, scanTypeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedKardex({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters],
  );

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "RESPONSABLE / GUARDIA",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.user?.name} {row.user?.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.user?.username || "S/U"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "location",
        label: "PUNTO DE CONTROL",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.location?.name || "UBICACIÓN DESCONOCIDA"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                QR ESCANEADO
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "timestamp",
        label: "CRONOMETRÍA",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {dayjs(row.timestamp).format("HH:mm:ss [HRS]")}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {dayjs(row.timestamp).format("DD MMM, YYYY")}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "scanType",
        label: "CLASIFICACIÓN",
        render: (row: KardexEntry) => (
          <ITBadget
            color={
              row.scanType === "ASSIGNMENT"
                ? "success"
                : row.scanType === "RECURRING"
                  ? "warning"
                  : "primary"
            }
            size="small"
          >
            {translateScanType(row.scanType)}
          </ITBadget>
        ),
      },
      {
        key: "multimedia",
        label: "EVIDENCIA",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.media?.length || 0} Archivos
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${row.media?.length ? "bg-emerald-400" : "bg-slate-200"}`}
              />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {row.media?.length ? "CON MULTIMEDIA" : "SIN EVIDENCIA"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: KardexEntry) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => setViewingEntry(row)}
              variant="outlined"
              size="small"
              color="secondary"
              title="Ver Detalle"
            >
              <FaEye size={14} />
            </ITButton>
            <ITButton
              onClick={() => setEntryToDeleteId(row.id)}
              variant="outlined"
              size="small"
              color="error"
              title="Eliminar"
            >
              <FaTrash size={14} />
            </ITButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6   min-h-screen font-sans">
      <ModuleHeader
        title="Expediente Kardex"
        subtitle="Registro histórico de marcajes, evidencias y reportes de campo"
        icon={FaBook}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR RESPONSABLE...",
          icon: FaUser,
        }}
        extraFilter={
          <ITTripleFilter
            value={scanTypeFilter}
            onChange={(val) => {
              setScanTypeFilter(val);
              setRefreshKey((prev) => prev + 1);
            }}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "ASIGNACIÓN", value: "ASSIGNMENT" },
              { label: "RECURRENTE", value: "RECURRING" },
            ]}
          />
        }
        dateRange={{
          value: selectedDate as [Date | null, Date | null],
          onChange: (val) => {
            setSelectedDate(val);
            setRefreshKey((prev) => prev + 1);
          },
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<KardexEntry & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
        <KardexDetailDialog
          isOpen={!!viewingEntry}
          onClose={() => setViewingEntry(null)}
          entry={viewingEntry}
          onDelete={setEntryToDeleteId}
        />
      </div>

      {/* DELETE KARDEX ENTRY DIALOG */}
      <ITDialog
        isOpen={!!entryToDeleteId}
        onClose={() => setEntryToDeleteId(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <FaTrash size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Eliminar Marcaje</h3>
                <p className="text-xs text-slate-400 font-light">Expediente Kardex</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el registro del expediente Kardex de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setEntryToDeleteId(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default KardexPage;
