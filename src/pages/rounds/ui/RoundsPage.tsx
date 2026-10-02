import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITSearchSelect,
  ITTripleFilter,
  type Column,
} from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import dayjs from "dayjs";
import { FaEye, FaRoute, FaStop, FaTrash, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import type { Round } from "@entities/round";
import { PageShell } from "@shared/ui";
import { useRoundsDeps } from "../model/deps";
import { roundVisualState, useRoundsPage } from "../model/useRoundsPage";

/** Rondas. Sólo pinta. */
const RoundsPage = () => {
  const navigate = useNavigate();
  const { data: clients } = useCatalog("client");
  const {
    isResident,
    routesMap,
    selectedDate,
    setSelectedDate,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedClientId,
    setSelectedClientId,
    externalFilters,
    memoizedFetch,
    refreshKey,
    refresh,
    roundToFinishId,
    setRoundToFinishId,
    roundToDeleteId,
    setRoundToDeleteId,
    isFinishing,
    isDeleting,
    confirmDeleteRound,
    handleEndRound,
  } = useRoundsPage(useRoundsDeps());

const columns = useMemo<Column<Round>[]>(
  () => {
    const getBg = (row: Round) => {
      const c = row._count?.kardexEntries || 0;
      if (c === 0) return roundVisualState(row).row;
      if (row.status === "COMPLETED") return roundVisualState(row).row;
      return roundVisualState(row).row;
    };

    const getDot = (row: Round) => {
      const c = row._count?.kardexEntries || 0;
      if (c === 0) return roundVisualState(row).dot;
      if (row.status === "COMPLETED") return roundVisualState(row).dot;
      return roundVisualState(row).dot;
    };

    const getStatus = (row: Round) => {
      const c = row._count?.kardexEntries || 0;
      if (c === 0) return { color: roundVisualState(row).color, label: roundVisualState(row).label };
      if (row.status === "COMPLETED") return { color: roundVisualState(row).color, label: roundVisualState(row).label };
      return { color: roundVisualState(row).color, label: roundVisualState(row).label };
    };

    return [
      {
        key: "recurringConfiguration",
        type: "string",
        label: "RUTA / REFERENCIA",
        render: (row: Round) => (
          <div
            style={{
              backgroundColor: getBg(row),
              padding: '13px 16px',
              height: '100%',
              width: '100%',
            }}
          >
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
              {row.recurringConfiguration?.title || routesMap[row.recurringConfigurationId] || "Ronda General"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${getDot(row)}`} />
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                {row.recurringConfiguration?.client?.name || row.client?.name || "SIN CLIENTE ASIGNADO"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "guard",
        type: "string",
        label: "PERSONAL OPERATIVO",
        render: (row: Round) => (
          <div
            style={{
              backgroundColor: getBg(row),
              padding: '13px 16px',
              height: '100%',
              width: '100%',
            }}
          >
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
              {row.guard.name} {row.guard.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">@{row.guard.name || "S/U"}</span>
            </div>
          </div>
        ),
      },
      {
        key: "times",
        type: "string",
        label: "CRONOLOGÍA",
        render: (row: Round) => {
          const isActive = !row.endTime;
          return (
            <div
              style={{
                backgroundColor: getBg(row),
                padding: '13px 16px',
                height: '100%',
                width: '100%',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-500">▶</span>
                <span className="font-mono font-bold text-slate-800 text-[11px]">{dayjs(row.startTime).format("DD MMM · HH:mm")}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {isActive ? (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <span className="text-[10px] text-slate-400">■</span>
                )}
                {isActive ? (
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">En curso</span>
                ) : (
                  <span className="font-mono font-bold text-slate-500 text-[11px]">
                    {row.endTime ? dayjs(row.endTime).format("DD MMM · HH:mm") : ""}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        type: "string",
        label: "ESTADO",
        render: (row: Round) => {
          const s = getStatus(row);
          const bgColor = getBg(row);
          return (
            <div
              style={{
                backgroundColor: bgColor,
                height: '100%',
                minHeight: '100%',
                width: '100%',
                padding: '22px 16px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ITBadget size="sm" color={s.color}>{s.label}</ITBadget>
            </div>
          );
        },
      },
      {
        key: "actions",
        type: "string",
        label: "CONTROL",
        render: (row: Round) => {
          const bgColor = getBg(row);
          return (
            <div
              style={{
                backgroundColor: bgColor,
                height: '100%',
                minHeight: '100%',
                width: '100%',
                padding: '20px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ITButton
                onClick={() => navigate(`/rounds/${row.id}`)}
                variant="outlined"
                size="sm"
                title="Detalles"
              >
                <FaEye size={14} />
              </ITButton>
              {row.status === "IN_PROGRESS" && !isResident && (
                <ITButton
                  onClick={() => setRoundToFinishId(row.id)}
                  variant="outlined"
                  size="sm"
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
                  size="sm"
                  color="error"
                  title="Eliminar"
                >
                  <FaTrash size={14} />
                </ITButton>
              )}
            </div>
          );
        },
      },
    ];
  },
  [navigate, routesMap, isResident],
);
  return (
    <PageShell
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
              setSelectedClientId(String(val));
              refresh();
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
          // El picker de rango puede devolver nulos: se ignoran.
          if (val[0] && val[1]) setSelectedDate([val[0], val[1]]);
          refresh();
        },
      }}
      extraFilter={
        <ITTripleFilter
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            refresh();
          }}
          options={[
            { label: "TODAS", value: "ALL" },
            { label: "ACTIVAS", value: "IN_PROGRESS" },
            { label: "HISTORIAL", value: "COMPLETED" },
          ]}
        />
      }
      onRefresh={refresh}
      refreshKey={refreshKey}
    >

      <div className="rounds-table bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<Round>
          key={refreshKey}
          columns={columns}
          fetchData={memoizedFetch}
          externalFilters={externalFilters as never}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* FINISH ROUND DIALOG */}
      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title=""
        className="!max-w-md w-full!"
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
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
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
        className="!max-w-md w-full!"
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
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={confirmDeleteRound}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </PageShell>
  );

  return (
    <PageShell
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
              setSelectedClientId(String(val));
              refresh();
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
          // El picker de rango puede devolver nulos: se ignoran.
          if (val[0] && val[1]) setSelectedDate([val[0], val[1]]);
          refresh();
        },
      }}
      extraFilter={
        <ITTripleFilter
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            refresh();
          }}
          options={[
            { label: "TODAS", value: "ALL" },
            { label: "ACTIVAS", value: "IN_PROGRESS" },
            { label: "HISTORIAL", value: "COMPLETED" },
          ]}
        />
      }
      onRefresh={refresh}
      refreshKey={refreshKey}
    >

      <div className="rounds-table bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<Round>
          key={refreshKey}
          columns={columns}
          fetchData={memoizedFetch}
          externalFilters={externalFilters as never}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* FINISH ROUND DIALOG */}
      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title=""
        className="!max-w-md w-full!"
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
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
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
        className="!max-w-md w-full!"
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
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              size="sm"
              className="px-5 whitespace-nowrap shadow shadow-rose-100"
              onClick={confirmDeleteRound}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "Eliminar"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </PageShell>
  );
};

export default RoundsPage;
