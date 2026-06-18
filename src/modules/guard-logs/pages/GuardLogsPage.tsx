import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITSearchSelect,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useMemo, useState } from "react";
import { FaClipboardList, FaClock, FaTrash, FaUserClock } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { showToast } from "@app/core/store/toast/toast.slice";
import { clockOut as clockOutService, deleteGuardLog, getPaginatedGuardLogs, IGuardLoginLog } from "../services/GuardLogsService";

dayjs.extend(utc);
dayjs.extend(timezone);

const GuardLogsPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").startOf("day").toDate(),
    dayjs().tz("America/Tijuana").endOf("day").toDate(),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(
    searchParams.get("clientId") || "",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [logToDelete, setLogToDelete] = useState<IGuardLoginLog | null>(null);
  const [logToClose, setLogToClose] = useState<IGuardLoginLog | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const { data: clients } = useCatalog("client");
  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  const confirmDelete = async () => {
    if (!logToDelete) return;
    setDeletingId(logToDelete.id);
    const res = await deleteGuardLog(logToDelete.id);
    setDeletingId(null);
    setLogToDelete(null);
    if (res.success) {
      dispatch(showToast({ message: "Registro eliminado", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: "Error al eliminar registro", type: "error" }));
    }
  };

  const confirmClose = async () => {
    if (!logToClose) return;
    setClosingId(logToClose.id);
    const res = await clockOutService(logToClose.userId);
    setClosingId(null);
    setLogToClose(null);
    if (res.success) {
      dispatch(showToast({ message: "Turno cerrado correctamente", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al cerrar turno", type: "error" }));
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
    if (statusFilter === "OPEN") {
      filters.isOpen = true;
    } else if (statusFilter === "CLOSED") {
      filters.isOpen = false;
    }
    if (selectedClientId) {
      filters.clientId = selectedClientId;
    } else if (isResident && user?.clientId) {
      filters.clientId = user.clientId;
    }
    return filters;
  }, [selectedDate, searchTerm, statusFilter, selectedClientId, isResident, user?.clientId]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      const res = await getPaginatedGuardLogs({
        ...params,
        filters: { ...params.filters, ...externalFilters },
        sort: params.sort || { key: "loginAt", direction: "desc" },
      });
      return res;
    },
    [externalFilters],
  );

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "GUARDIA",
        render: (row: IGuardLoginLog) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">
              {row.user.name?.[0]}
              {row.user.lastName?.[0]}
            </div>
            <div>
              <span className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1 block">
                {row.user.name} {row.user.lastName}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                @{row.user.username}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "loginAt",
        label: "ENTRADA",
        render: (row: IGuardLoginLog) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-700 uppercase">
              {dayjs(row.loginAt).tz("America/Tijuana").format("DD MMM YYYY")}
            </span>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              {dayjs(row.loginAt).tz("America/Tijuana").format("HH:mm:ss")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "logoutAt",
        label: "SALIDA",
        render: (row: IGuardLoginLog) => (
          <div className="flex flex-col">
            {row.logoutAt ? (
              <>
                <span className="text-[10px] font-black text-slate-700 uppercase">
                  {dayjs(row.logoutAt).tz("America/Tijuana").format("DD MMM YYYY")}
                </span>
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">
                  {dayjs(row.logoutAt).tz("America/Tijuana").format("HH:mm:ss")} HRS
                </span>
              </>
            ) : (
              <ITBadget color="warning" size="small">
                ABIERTO
              </ITBadget>
            )}
          </div>
        ),
      },
      {
        key: "duration",
        label: "DURACIÓN",
        render: (row: IGuardLoginLog) => {
          if (!row.logoutAt) {
            return (
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">
                EN CURSO
              </span>
            );
          }
          const diff = dayjs(row.logoutAt).diff(dayjs(row.loginAt));
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          return (
            <span className="text-[11px] font-black text-slate-700 font-mono">
              {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")} HRS
            </span>
          );
        },
      },
      {
        key: "actions",
        label: "",
        width: 136,
        render: (row: IGuardLoginLog) => (
          <div className="flex items-center gap-1">
            {!row.logoutAt && (
              <ITButton
                onClick={() => setLogToClose(row)}
                color="success"
                variant="outlined"
                size="small"
                title="Cerrar Turno"
                disabled={closingId === row.id || deletingId === row.id}
              >
                {closingId === row.id ? <ITLoader size="sm" /> : <FaClock size={14} />}
              </ITButton>
            )}
            <ITButton
              onClick={() => setLogToDelete(row)}
              color="error"
              variant="outlined"
              size="small"
              title="Eliminar"
              disabled={deletingId === row.id || closingId === row.id}
            >
              {deletingId === row.id ? <ITLoader size="sm" /> : <FaTrash size={14} />}
            </ITButton>
          </div>
        ),
      },
    ],
    [deletingId, closingId],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Prenómina - Control de Asistencia"
        subtitle="Registro de entrada y salida de guardias operativos"
        icon={FaClipboardList}
        filter={
          !isResident && (
            <ITSearchSelect
              placeholder="FILTRAR POR CLIENTE..."
              options={(clients || []).map((c: any) => ({
                label: c.name,
                value: c.id,
              }))}
              value={selectedClientId}
              onChange={(val) => {
                setSelectedClientId(val);
                setRefreshKey((prev) => prev + 1);
              }}
              className="w-full"
            />
          )
        }
        search={{
          value: searchTerm,
          onChange: (val: string) => {
            setSearchTerm(val);
            setRefreshKey((prev) => prev + 1);
          },
          placeholder: "BUSCAR GUARDIA...",
          icon: FaUserClock,
        }}
        dateRange={{
          value: selectedDate as [Date | null, Date | null],
          onChange: (val) => {
            setSelectedDate(val);
            setRefreshKey((prev) => prev + 1);
          },
        }}
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setRefreshKey((prev) => prev + 1);
            }}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "ABIERTOS", value: "OPEN" },
              { label: "CERRADOS", value: "CLOSED" },
            ]}
          />
        }
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable<IGuardLoginLog & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* CLOSE SHIFT DIALOG */}
      <ITDialog
        isOpen={!!logToClose}
        onClose={() => setLogToClose(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <FaClock size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Cerrar Turno</h3>
                <p className="text-xs text-slate-400 font-light">{logToClose?.user?.name || "Guardia"}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Se registrará la salida del guardia. El turno quedará cerrado y no podrá modificarse.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setLogToClose(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-sky-100"
              onClick={confirmClose}
              disabled={!!closingId}
            >
              {closingId ? <ITLoader size="sm" color="white" /> : "Cerrar Turno"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* DELETE LOG DIALOG */}
      <ITDialog
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
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
                <h3 className="text-base font-medium text-slate-800">Eliminar Registro</h3>
                <p className="text-xs text-slate-400 font-light">{logToDelete?.user?.name || "Prenómina"}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el registro de prenómina de forma permanente. No podrá recuperarse.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setLogToDelete(null)}
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
              disabled={!!deletingId}
            >
              {deletingId ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default GuardLogsPage;
