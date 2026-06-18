import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEye, FaRoute, FaStop, FaTrash, FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRoutesList } from "../../routes/services/RoutesService";
import {
  deleteRound,
  endRound,
  getPaginatedRounds,
  IRound,
} from "../services/RoundsService";

dayjs.extend(utc);
dayjs.extend(timezone);

const RoundsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").toDate(),
    dayjs().tz("America/Tijuana").toDate(),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(
    searchParams.get("clientId") || "",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: clients } = useCatalog("client");
  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  const [routesMap, setRoutesMap] = useState<Record<string, string>>({});
  const [roundToFinishId, setRoundToFinishId] = useState<string | null>(null);
  const [roundToDeleteId, setRoundToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getRoutesList().then((res) => {
      if (res.success && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach((r: any) => {
          map[r.id] = r.title;
        });
        setRoutesMap(map);
      }
    });
  }, []);

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

    if (statusFilter !== "ALL") {
      filters.status = statusFilter;
    }

    if (selectedClientId) {
      filters.clientId = selectedClientId;
    } else if (isResident && user?.clientId) {
      filters.clientId = user.clientId;
    }

    return filters;
  }, [
    selectedDate,
    searchTerm,
    statusFilter,
    selectedClientId,
    isResident,
    user?.clientId,
  ]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      const res = await getPaginatedRounds({
        ...params,
        filters: { ...params.filters, ...externalFilters },
        sort: params.sort || { key: "startTime", direction: "desc" },
      });
      return res;
    },
    [externalFilters],
  );

  const confirmDeleteRound = async () => {
    if (!roundToDeleteId || isDeleting) return;
    setIsDeleting(true);
    const res = await deleteRound(roundToDeleteId);
    setIsDeleting(false);
    setRoundToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ronda eliminada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(showToast({ message: res.messages?.[0] || "Error al eliminar ronda", type: "error" }));
    }
  };

  const handleEndRound = async () => {
    if (!roundToFinishId || isFinishing) return;
    setIsFinishing(true);
    const res = await endRound(roundToFinishId);
    setIsFinishing(false);
    setRoundToFinishId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ronda finalizada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(showToast({ message: "Error al finalizar", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "recurringConfiguration",
        label: "RUTA / REFERENCIA",
        render: (row: IRound) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.recurringConfiguration?.title ||
                routesMap[row.recurringConfigurationId] ||
                "Ronda General"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {row.recurringConfiguration?.client?.name ||
                  row.client?.name ||
                  "SIN CLIENTE ASIGNADO"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "guard",
        label: "PERSONAL OPERATIVO",
        render: (row: IRound) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.guard.name} {row.guard.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.guard.name || "S/U"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "times",
        label: "CRONOLOGÍA",
        render: (row: IRound) => {
          const isActive = !row.endTime;
          const startDate = dayjs(row.startTime);
          const endDate = row.endTime ? dayjs(row.endTime) : null;

          return (
            <div className="flex flex-col gap-1.5">
              {/* INICIO - destacado */}
              <div className="flex items-center gap-2">
                <div className="w-5 text-center">
                  <span className="text-[10px] font-black text-sky-500">
                    ▶
                  </span>
                </div>
                <div>
                  <span className="text-[12px] font-mono font-bold text-slate-800">
                    {startDate.format("DD MMM · HH:mm:ss")}
                  </span>
                </div>
              </div>

              {/* FIN / EN PROCESO - dinámico */}
              <div className="flex items-center gap-2">
                <div className="w-5 text-center">
                  {isActive ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-200" />
                  ) : (
                    <span className="text-[10px] text-slate-400">■</span>
                  )}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isActive ? "text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    {isActive ? "EN PROCESO" : ""}
                  </span>
                  <div
                    className={`text-[12px] font-mono font-bold ${
                      isActive ? "text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    {isActive
                      ? "— en curso —"
                      : endDate?.format("DD MMM · HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: IRound) => (
          <ITBadget
            size="small"
            color={row.status === "COMPLETED" ? "success" : "warning"}
          >
            {row.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: IRound) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => navigate(`/rounds/${row.id}`)}
              variant="outlined"
              size="small"
              title="Detalles"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "IN_PROGRESS" && !isResident && (
              <ITButton
                onClick={() => setRoundToFinishId(row.id)}
                variant="outlined"
                size="small"
                color="error"
                title="Finalizar"
              >
                <FaStop size={14} />
              </ITButton>
            )}
            {row.status === "COMPLETED" && (
              <ITButton
                onClick={() => setRoundToDeleteId(row.id)}
                variant="outlined"
                size="small"
                color="error"
                title="Eliminar"
              >
                <FaTrash size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [navigate, routesMap, isResident],
  );

  return (
    <div className="p-6   min-h-screen font-sans">
      <ModuleHeader
        title="Historial de Rondas"
        subtitle="Supervisión y cronología de recorridos operativos en tiempo real"
        icon={FaRoute}
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
          onChange: setSearchTerm,
          placeholder: "BUSCAR GUARDIA...",
          icon: FaUser,
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
              { label: "TODAS", value: "ALL" },
              { label: "ACTIVAS", value: "IN_PROGRESS" },
              { label: "HISTORIAL", value: "COMPLETED" },
            ]}
          />
        }
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<IRound & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* FINISH ROUND DIALOG */}
      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <FaStop size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Finalizar Recorrido</h3>
                <p className="text-xs text-slate-400 font-light">Forzar cierre de ronda</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción cerrará la ronda actual de forma forzada. Los puntos pendientes quedarán registrados como incompletos.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setRoundToFinishId(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-amber-100"
              onClick={handleEndRound}
              disabled={isFinishing}
            >
              {isFinishing ? <ITLoader size="sm" color="white" /> : "Finalizar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* DELETE ROUND DIALOG */}
      <ITDialog
        isOpen={!!roundToDeleteId}
        onClose={() => setRoundToDeleteId(null)}
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
                <h3 className="text-base font-medium text-slate-800">Eliminar Ronda</h3>
                <p className="text-xs text-slate-400 font-light">Esta acción es permanente</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el registro de la ronda y todo su historial asociado de forma permanente.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setRoundToDeleteId(null)}
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
              onClick={confirmDeleteRound}
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

export default RoundsPage;
