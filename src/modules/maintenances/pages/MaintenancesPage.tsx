import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
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
import {
  FaCheck,
  FaEye,
  FaTrash,
  FaWrench,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import MaintenanceDetailDialog from "../components/MaintenanceDetailDialog";
import {
  deleteMaintenance,
  getPaginatedMaintenances,
  Maintenance,
  resolveMaintenance,
} from "../services/MaintenanceService";

const MaintenancesPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdmin = auth.role === "ADMIN" || auth.role === "LIDER";
  const isClient = auth.role === "RESDN";

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingMaintenance, setViewingMaintenance] =
    useState<Maintenance | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [maintenanceToResolveId, setMaintenanceToResolveId] = useState<
    number | null
  >(null);
  const [maintenanceToDelete, setMaintenanceToDelete] =
    useState<Maintenance | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: guardsCatalog } = useCatalog("guard");

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (statusFilter !== "ALL") f.status = statusFilter;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: Record<string, unknown>) => {
      return getPaginatedMaintenances({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const handleResolve = (id: number) => setMaintenanceToResolveId(id);

  const confirmResolve = async () => {
    if (!maintenanceToResolveId) return;
    setResolvingId(maintenanceToResolveId);
    const res = await resolveMaintenance(maintenanceToResolveId as any);
    setResolvingId(null);
    setMaintenanceToResolveId(null);

    if (res.success) {
      setRefreshKey((p) => p + 1);
      if (viewingMaintenance?.id === (maintenanceToResolveId as any)) {
        setViewingMaintenance(null);
      }
      dispatch(
        showToast({ message: "Mantenimiento resuelto", type: "success" }),
      );
    } else {
      dispatch(
        showToast({
          message: "Error al resolver mantenimiento",
          type: "error",
        }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!maintenanceToDelete) return;
    setDeletingId(maintenanceToDelete.id as any);
    const res = await deleteMaintenance(maintenanceToDelete.id);
    setDeletingId(null);
    setMaintenanceToDelete(null);

    if (res.success) {
      dispatch(showToast({ message: "Registro eliminado", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Mantenimiento",
        render: (row: Maintenance) => (
          <div className="flex items-start gap-3">
            <div className="mt-1 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
              <FaWrench size={12} />
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1">
                {row.title}
              </p>
              <div className="flex gap-2 items-center mt-0.5">
                <ITBadget
                  label={row.category || "GENERAL"}
                  color="warning"
                  variant="outlined"
                  className="!text-[8px] !px-1.5 !py-0.5 !h-auto"
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "Reportado",
        render: (row: Maintenance) => (
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              {dayjs(row.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {dayjs(row.createdAt).format("HH:mm")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "guardId",
        label: "REPORTADO POR",
        render: (row: Maintenance) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.guard?.name} {row.guard?.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.guard?.username || "S/U"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: Maintenance) => (
          <ITBadget
            color={row.status === "ATTENDED" ? "primary" : "danger"}
            size="small"
          >
            {row.status === "ATTENDED" ? "ATENDIDA" : "PENDIENTE"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: Maintenance) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => setViewingMaintenance(row)}
              variant="outlined"
              color="secondary"
              title="Ver detalle"
              size="small"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && !isClient && (
              <ITButton
                onClick={() => handleResolve(row.id)}
                variant="outlined"
                color="success"
                title="Resolver"
                size="small"
                disabled={resolvingId === row.id}
              >
                {resolvingId === row.id ? (
                  <ITLoader size="sm" />
                ) : (
                  <FaCheck size={14} />
                )}
              </ITButton>
            )}
            {isAdmin && (
              <ITButton
                onClick={() => setMaintenanceToDelete(row)}
                variant="outlined"
                color="error"
                title="Eliminar"
                size="small"
              >
                <FaTrash size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [isAdmin, resolvingId, isClient],
  );

  return (
    <div className="p-6   min-h-screen font-sans">
      <ModuleHeader
        title="Gestión de Mantenimientos"
        subtitle="Monitoreo y resolución de desperfectos en instalaciones"
        icon={FaWrench}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR REPORTE...",
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "PENDIENTES", value: "PENDING" },
              { label: "ATENDIDAS", value: "ATTENDED" },
            ]}
          />
        }
      />
      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable<Maintenance & Record<string, unknown>>
          key={`${refreshKey}-${guardsCatalog?.length || 0}`}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>{" "}
      {/* DETAIL MODAL - Versión Modularizada */}
      <MaintenanceDetailDialog
        isOpen={!!viewingMaintenance}
        onClose={() => setViewingMaintenance(null)}
        maintenance={viewingMaintenance}
        onResolve={handleResolve}
        onDelete={setMaintenanceToDelete}
        isAdmin={isAdmin}
        isClient={isClient}
      />
      {/* RESOLVE MAINTENANCE DIALOG */}
      <ITDialog
        isOpen={!!maintenanceToResolveId}
        onClose={() => setMaintenanceToResolveId(null)}
        title=""
        className="!max-w-md !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
          <div className="px-8 pt-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <FaCheck size={18} />
              </div>
              <div>
                <h3 className="text-base font-medium text-slate-800">Resolver Mantenimiento</h3>
                <p className="text-xs text-slate-400 font-light">Confirmar resolución</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              El mantenimiento será marcado como atendido. Esta acción no puede deshacerse.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setMaintenanceToResolveId(null)}
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-slate-100"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              size="small"
              className="px-5 whitespace-nowrap shadow shadow-emerald-100"
              onClick={confirmResolve}
              disabled={!!resolvingId}
            >
              {resolvingId ? <ITLoader size="sm" color="white" /> : "Sí, Resolver"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
      {/* DELETE MAINTENANCE DIALOG */}
      <ITDialog
        isOpen={!!maintenanceToDelete}
        onClose={() => setMaintenanceToDelete(null)}
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
                <p className="text-xs text-slate-400 font-light">Mantenimiento</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
              Esta acción eliminará el reporte de mantenimiento y todo su historial asociado.
            </p>
          </div>

          <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setMaintenanceToDelete(null)}
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

export default MaintenancesPage;
