import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClock,
  FaEye,
  FaStop,
  FaSync,
  FaTimesCircle,
  FaUser,
  FaBuilding,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getUsers } from "../../users/services/UserService";
import {
  endRound,
  getPaginatedRounds,
  IRound,
} from "../services/RoundsService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { useCatalog } from "@app/core/hooks/catalog.hook";

dayjs.extend(utc);
dayjs.extend(tz);

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
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: clients } = useCatalog("client");
  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync selectedClientId with URL
  useEffect(() => {
    const cid = searchParams.get("clientId");
    if (cid) {
      setSelectedClientId(cid);
      setRefreshKey((prev) => prev + 1);
    }
  }, [searchParams]);

  const externalFilters = useMemo(() => {
    const filters: any = { refreshKey };

    if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
      filters.date = [
        dayjs(selectedDate[0]).tz("America/Tijuana").startOf("day").format(),
        dayjs(selectedDate[1]).tz("America/Tijuana").endOf("day").format(),
      ];
    }

    if (searchTerm && searchTerm.trim().length > 0) {
      filters.search = searchTerm.trim();
    }

    if (statusFilter && statusFilter !== "ALL") {
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
    refreshKey,
    searchTerm,
    statusFilter,
    selectedClientId,
    isResident,
    user?.id,
  ]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRounds({
      ...params,
      sort: params.sort || { key: "startTime", direction: "desc" },
    });
  }, []);

  const [routesMap, setRoutesMap] = useState<Record<number, string>>({});
  const [guards, setGuards] = useState<any[]>([]);
  const [roundToFinishId, setRoundToFinishId] = useState<number | null>(null);

  useEffect(() => {
    getRoutesList().then((res) => {
      if (res.success && res.data) {
        const map: Record<number, string> = {};
        res.data.forEach((r: any) => {
          map[r.id] = r.title;
        });
        setRoutesMap(map);
      }
    });

    getUsers().then((res) => {
      if (res.success && res.data) {
        const onlyGuards = res.data.filter((u: any) => {
          const roleName = typeof u.role === "object" ? u.role.name : u.role;
          return (
            roleName === "GUARD" || roleName === "SHIFT" || roleName === "MAINT"
          );
        });
        setGuards(onlyGuards);
      }
    });
  }, []);

  const handleEndRound = (roundId: number) => {
    setRoundToFinishId(roundId);
  };

  const confirmEndRound = async () => {
    if (!roundToFinishId) return;
    try {
      const res = await endRound(roundToFinishId);
      setRoundToFinishId(null);
      if (res.success) {
        dispatch(
          showToast({
            message: "Ronda finalizada correctamente",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({
            message: res.messages?.join("\n") || "Error al finalizar ronda",
            type: "error",
          }),
        );
      }
    } catch (e) {
      setRoundToFinishId(null);
      dispatch(
        showToast({ message: "Error al finalizar ronda", type: "error" }),
      );
    }
  };

  const memoizedColumns = useMemo(
    () => [
      ...(isResident
        ? []
        : [
            {
              key: "client",
              label: "Cliente",
              type: "string",
              render: (row: any) => (
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-slate-400 text-xs" />
                  <span className="font-bold text-slate-700 uppercase text-[11px] tracking-tight">
                    {row.client?.name ||
                      row.recurringConfiguration?.client?.name ||
                      row.guard?.client?.name ||
                      "Sin Cliente"}
                  </span>
                </div>
              ),
            },
          ]),
      {
        key: "recurringConfiguration",
        label: "Ronda",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <span className="font-semibold text-slate-700">
            {row.recurringConfiguration?.title ||
              routesMap[row.recurringConfigurationId] ||
              "Ronda General"}
          </span>
        ),
      },
      {
        key: "guard",
        label: "Guardia",
        type: "string",
        render: (row: IRound) => (
          <div className="font-medium text-slate-700">
            {row.guard.name} {row.guard.lastName}
          </div>
        ),
      },
      {
        key: "startTime",
        label: "Inicio",
        type: "string",
        sortable: true,
        render: (row: IRound) => (
          <span className="text-slate-600 text-sm">
            {new Date(row.startTime).toLocaleString()}
          </span>
        ),
      },
      {
        key: "endTime",
        label: "Fin",
        type: "string",
        sortable: true,
        render: (row: IRound) => (
          <span className="text-slate-600 text-sm">
            {row.endTime ? new Date(row.endTime).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Estado",
        type: "string",
        sortable: true,
        render: (row: IRound) => (
          <ITBadget
            color={row.status === "COMPLETED" ? "secondary" : "warning"}
            variant="filled"
            size="small"
          >
            {row.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: IRound) => (
          <div className="flex gap-2">
            <ITButton
              onClick={() => navigate(`/rounds/${row.id}`)}
              size="small"
              color="primary"
              variant="outlined"
              className="!p-2"
              title="Ver detalles"
            >
              <FaEye />
            </ITButton>

            {row.status === "IN_PROGRESS" && (
              <ITButton
                onClick={() => handleEndRound(Number(row.id))}
                size="small"
                color="danger"
                variant="filled"
                className="!p-2"
                title="Finalizar Ronda (Admin)"
              >
                <FaStop />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [routesMap, navigate, guards],
  );

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <FaClock className="text-blue-500" />
          Historial de recorridos
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Historial y supervisión de recorridos por cliente
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 mb-8 w-full">
        {!isResident && (
          <div className="w-full sm:w-64">
            <ITSearchSelect
              placeholder="Filtrar por Cliente"
              options={(clients || []).map((c: any) => ({
                label: c.name,
                value: c.id,
              }))}
              value={selectedClientId}
              onChange={(val) => {
                setSelectedClientId(val);
                setRefreshKey((prev) => prev + 1);
              }}
            />
          </div>
        )}

        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] w-full sm:w-64 shadow-sm focus-within:border-emerald-500/50 transition-all">
          <FaUser className="text-slate-300 text-xs mr-2" />
          <input
            type="text"
            placeholder="Buscar Guardia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full placeholder:text-slate-300 placeholder:font-normal"
          />
          {searchTerm.length > 0 && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-300 hover:text-red-400 transition-all"
            >
              <FaTimesCircle className="text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 h-[42px] w-full sm:w-auto min-w-[130px] shadow-sm">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setRefreshKey((prev) => prev + 1);
            }}
            className="bg-transparent text-sm font-bold text-slate-600 outline-none w-full"
          >
            <option value="ALL">Todos los estados</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="COMPLETED">Finalizadas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ITDatePicker
            label=""
            name="date"
            value={selectedDate as any}
            range
            onChange={(e) => {
              const val = e.target.value as any;
              if (Array.isArray(val)) {
                const parsedDates = val.map((d) => (d ? new Date(d) : null));
                setSelectedDate(parsedDates);
                if (parsedDates[0] && parsedDates[1])
                  setRefreshKey((prev) => prev + 1);
              } else if (val) {
                const date = new Date(val);
                setSelectedDate([date, date]);
                setRefreshKey((prev) => prev + 1);
              } else {
                setSelectedDate(null);
                setRefreshKey((prev) => prev + 1);
              }
            }}
            className="text-sm text-slate-600 outline-none font-medium h-[42px]"
          />
          <ITButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            color="secondary"
            variant="outlined"
            className="h-[42px] px-3 !rounded-xl border-slate-200 hover:bg-slate-50 transition-all"
            size="small"
          >
            <FaSync className={`text-xs text-slate-500`} />
          </ITButton>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={memoizedColumns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
        />
      </div>

      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title="Confirmar Finalización"
      >
        <div className="p-6">
          <p className="text-[#1b1b1f] text-base mb-6">
            ¿Seguro que deseas FINALIZAR esta ronda manualmente? Esta acción no
            se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setRoundToFinishId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton variant="solid" color="danger" onClick={confirmEndRound}>
              Finalizar Ronda
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoundsPage;
